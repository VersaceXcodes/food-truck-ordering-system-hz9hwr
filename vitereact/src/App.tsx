import React from "react";
import { Route, Routes } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from '@/store/main';

// Import shared global views
import GV_TopNav from '@/components/views/GV_TopNav.tsx';
import GV_Footer from '@/components/views/GV_Footer.tsx';
import GV_NotificationBar from '@/components/views/GV_NotificationBar.tsx';

// Import unique views
import UV_Landing from '@/components/views/UV_Landing.tsx';
import UV_SignUp from '@/components/views/UV_SignUp.tsx';
import UV_Login from '@/components/views/UV_Login.tsx';
import UV_ForgotPassword from '@/components/views/UV_ForgotPassword.tsx';
import UV_Home from '@/components/views/UV_Home.tsx';
import UV_FoodTruckDetail from '@/components/views/UV_FoodTruckDetail.tsx';
import UV_CartReview from '@/components/views/UV_CartReview.tsx';
import UV_PaymentReview from '@/components/views/UV_PaymentReview.tsx';
import UV_OrderConfirmation from '@/components/views/UV_OrderConfirmation.tsx';
import UV_OrderTracking from '@/components/views/UV_OrderTracking.tsx';
import UV_OrderHistory from '@/components/views/UV_OrderHistory.tsx';
import UV_Profile from '@/components/views/UV_Profile.tsx';
import UV_ReviewOverlay from '@/components/views/UV_ReviewOverlay.tsx';
import UV_OperatorDashboard from '@/components/views/UV_OperatorDashboard.tsx';
import UV_OperatorMenuManagement from '@/components/views/UV_OperatorMenuManagement.tsx';
import UV_OperatorOrderManagement from '@/components/views/UV_OperatorOrderManagement.tsx';
import UV_OperatorOrderHistory from '@/components/views/UV_OperatorOrderHistory.tsx';
import UV_AdminDashboard from '@/components/views/UV_AdminDashboard.tsx';

const App: React.FC = () => {
  // Get the modal flag for the review overlay from the global UI state
  const showReviewOverlay = useSelector(
    (state: RootState) => state.global_ui_state.modals.reviewOverlay
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Global Top Navigation (fixed at the top) */}
      <GV_TopNav />

      {/* Global Notification Bar (typically positioned top-right via its own styles) */}
      <GV_NotificationBar />

      {/* Main content area for unique views rendered via Routes */}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<UV_Landing />} />
          <Route path="/login" element={<UV_Login />} />
          <Route path="/signup" element={<UV_SignUp />} />
          <Route path="/forgot-password" element={<UV_ForgotPassword />} />
          <Route path="/home" element={<UV_Home />} />
          <Route path="/food-trucks/:id" element={<UV_FoodTruckDetail />} />
          <Route path="/cart" element={<UV_CartReview />} />
          <Route path="/checkout" element={<UV_PaymentReview />} />
          <Route path="/order-confirmation" element={<UV_OrderConfirmation />} />
          <Route path="/order-tracking" element={<UV_OrderTracking />} />
          <Route path="/order-history" element={<UV_OrderHistory />} />
          <Route path="/profile" element={<UV_Profile />} />
          <Route path="/operator/dashboard" element={<UV_OperatorDashboard />} />
          <Route path="/operator/menu" element={<UV_OperatorMenuManagement />} />
          <Route path="/operator/orders" element={<UV_OperatorOrderManagement />} />
          <Route path="/operator/orders/history" element={<UV_OperatorOrderHistory />} />
          <Route path="/admin/dashboard" element={<UV_AdminDashboard />} />
        </Routes>
      </main>

      {/* Global Footer (always displayed at the bottom) */}
      <GV_Footer />

      {/* Conditionally render the Review Overlay modal if active */}
      {showReviewOverlay && <UV_ReviewOverlay />}
    </div>
  );
};

export default App;