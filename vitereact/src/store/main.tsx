import { configureStore, combineReducers, Middleware, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import axios from "axios";
import { io, Socket } from "socket.io-client";

// ------------------------
// auth_state slice
// ------------------------
interface AuthState {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  token: string;
  isAuthenticated: boolean;
}

const initialAuthState: AuthState = {
  user_id: "",
  full_name: "",
  email: "",
  role: "",
  token: "",
  isAuthenticated: false
};

const authSlice = createSlice({
  name: "auth_state",
  initialState: initialAuthState,
  reducers: {
    set_auth(state, action: PayloadAction<AuthState>) {
      state.user_id = action.payload.user_id;
      state.full_name = action.payload.full_name;
      state.email = action.payload.email;
      state.role = action.payload.role;
      state.token = action.payload.token;
      state.isAuthenticated = action.payload.isAuthenticated;
    },
    clear_auth(state) {
      state.user_id = "";
      state.full_name = "";
      state.email = "";
      state.role = "";
      state.token = "";
      state.isAuthenticated = false;
    }
  }
});
export const { set_auth, clear_auth } = authSlice.actions;

// ------------------------
// notifications_state slice
// ------------------------
interface Notification {
  id: string;
  message: string;
  is_read: boolean;
  created_at: number;
}

interface NotificationsState {
  notifications: Notification[];
}

const initialNotificationsState: NotificationsState = {
  notifications: []
};

const notificationsSlice = createSlice({
  name: "notifications_state",
  initialState: initialNotificationsState,
  reducers: {
    set_notifications(state, action: PayloadAction<Notification[]>) {
      state.notifications = action.payload;
    },
    add_notification(state, action: PayloadAction<Notification>) {
      state.notifications.push(action.payload);
    },
    mark_notification_as_read(state, action: PayloadAction<string>) {
      const notif = state.notifications.find(n => n.id === action.payload);
      if (notif) {
        notif.is_read = true;
      }
    },
    remove_notification(state, action: PayloadAction<string>) {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    }
  }
});
export const { set_notifications, add_notification, mark_notification_as_read, remove_notification } = notificationsSlice.actions;

// ------------------------
// orders_state slice
// ------------------------
interface OrdersState {
  currentOrder: any | null;
  orderHistory: any[];
  tracking: any | null;
}

const initialOrdersState: OrdersState = {
  currentOrder: null,
  orderHistory: [],
  tracking: null
};

const ordersSlice = createSlice({
  name: "orders_state",
  initialState: initialOrdersState,
  reducers: {
    set_current_order(state, action: PayloadAction<any>) {
      state.currentOrder = action.payload;
    },
    clear_current_order(state) {
      state.currentOrder = null;
    },
    set_order_history(state, action: PayloadAction<any[]>) {
      state.orderHistory = action.payload;
    },
    set_tracking(state, action: PayloadAction<any>) {
      state.tracking = action.payload;
    },
    update_tracking(state, action: PayloadAction<{ order_id: string; new_status: string; changed_at: number }>) {
      if (state.currentOrder && state.currentOrder.id === action.payload.order_id) {
        state.currentOrder.status = action.payload.new_status;
      }
      state.tracking = { ...action.payload };
    }
  }
});
export const { set_current_order, clear_current_order, set_order_history, set_tracking, update_tracking } = ordersSlice.actions;

// ------------------------
// global_ui_state slice
// ------------------------
interface GlobalUiState {
  discoveryViewMode: string;
  modals: {
    reviewOverlay: boolean;
  };
}

const initialGlobalUiState: GlobalUiState = {
  discoveryViewMode: "list",
  modals: {
    reviewOverlay: false
  }
};

const globalUiSlice = createSlice({
  name: "global_ui_state",
  initialState: initialGlobalUiState,
  reducers: {
    set_view_mode(state, action: PayloadAction<string>) {
      state.discoveryViewMode = action.payload;
    },
    set_modal(state, action: PayloadAction<{ modal: string; value: boolean }>) {
      state.modals[action.payload.modal] = action.payload.value;
    }
  }
});
export const { set_view_mode, set_modal } = globalUiSlice.actions;

// ------------------------
// cart_state slice
// ------------------------
interface CartItem {
  menu_item_id: string;
  quantity: number;
  customizations: string;
}

interface CartState {
  items: CartItem[];
  total: number;
}

const initialCartState: CartState = {
  items: [],
  total: 0
};

const cartSlice = createSlice({
  name: "cart_state",
  initialState: initialCartState,
  reducers: {
    add_cart_item(state, action: PayloadAction<CartItem>) {
      const existing = state.items.find(
        item =>
          item.menu_item_id === action.payload.menu_item_id &&
          item.customizations === action.payload.customizations
      );
      if (existing) {
        existing.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
    },
    remove_cart_item(state, action: PayloadAction<string>) {
      state.items = state.items.filter(item => item.menu_item_id !== action.payload);
    },
    update_cart_total(state) {
      let sum = 0;
      // Total calculation is assumed to be externally provided; placeholder here.
      state.total = sum;
    },
    clear_cart(state) {
      state.items = [];
      state.total = 0;
    },
    set_cart_total(state, action: PayloadAction<number>) {
      state.total = action.payload;
    }
  }
});
export const { add_cart_item, remove_cart_item, update_cart_total, clear_cart, set_cart_total } = cartSlice.actions;

// ------------------------
// Combine reducers and persist configuration
// ------------------------
const rootReducer = combineReducers({
  auth_state: authSlice.reducer,
  notifications_state: notificationsSlice.reducer,
  orders_state: ordersSlice.reducer,
  global_ui_state: globalUiSlice.reducer,
  cart_state: cartSlice.reducer
});

export type RootState = ReturnType<typeof rootReducer>;

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth_state", "notifications_state", "orders_state", "global_ui_state", "cart_state"]
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// ------------------------
// Socket middleware for realtime subscriptions
// ------------------------
let socket: Socket | null = null;

const socketMiddleware: Middleware<{}, RootState> = storeAPI => next => action => {
  const result = next(action);

  // When auth is set, try to connect socket with token
  if (action.type === "auth_state/set_auth") {
    const token = storeAPI.getState().auth_state.token;
    if (token && !socket) {
      socket = io("ws://localhost:1337", {
        query: { token }
      });
      socket.on("order_status_update", (data: { order_id: string; new_status: string; changed_at: number }) => {
        storeAPI.dispatch(update_tracking(data));
      });
      socket.on("new_order_notification", (data: { order_id: string; customer_id: string; food_truck_id: string; order_status: string; created_at: number }) => {
        const notification: Notification = {
          id: data.order_id,
          message: `New order received with id ${data.order_id}`,
          is_read: false,
          created_at: data.created_at
        };
        storeAPI.dispatch(add_notification(notification));
      });
    }
  }
  // When auth is cleared, disconnect socket
  if (action.type === "auth_state/clear_auth") {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  }

  return result;
};

// ------------------------
// Configure store
// ------------------------
const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware => getDefaultMiddleware({
    serializableCheck: false // disable check for non-serializable values (redux-persist and socket)
  }).concat(socketMiddleware)
});

export const persistor = persistStore(store);

// ------------------------
// Export actions and default store
// ------------------------
export {
  set_auth,
  clear_auth,
  set_notifications,
  add_notification,
  mark_notification_as_read,
  remove_notification,
  set_current_order,
  clear_current_order,
  set_order_history,
  set_tracking,
  update_tracking,
  set_view_mode,
  set_modal,
  add_cart_item,
  remove_cart_item,
  update_cart_total,
  clear_cart,
  set_cart_total
};

export default store;