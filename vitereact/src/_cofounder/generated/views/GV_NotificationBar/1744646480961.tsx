import React, { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, remove_notification } from "@/store/main";

const GV_NotificationBar: React.FC = () => {
  const dispatch = useDispatch();
  // Get notifications from global state
  const notifications = useSelector((state: RootState) => state.notifications_state.notifications);
  // Auto dismiss duration from datamap default; in ms.
  const autoDismissDuration = 6000;
  // Ref to store timeout ids for each notification
  const timeoutIdsRef = useRef<{ [key: string]: number }>({});

  // useEffect to schedule auto dismissal every time notifications change
  useEffect(() => {
    // Clear timers for notifications no longer present
    Object.keys(timeoutIdsRef.current).forEach(id => {
      if (!notifications.find(notification => notification.id === id)) {
        clearTimeout(timeoutIdsRef.current[id]);
        delete timeoutIdsRef.current[id];
      }
    });
    // Schedule dismissal for new notifications
    notifications.forEach(notification => {
      if (!timeoutIdsRef.current[notification.id]) {
        timeoutIdsRef.current[notification.id] = window.setTimeout(() => {
          dispatch(remove_notification(notification.id));
          delete timeoutIdsRef.current[notification.id];
        }, autoDismissDuration);
      }
    });
    // Cleanup: clear all timeouts when component unmounts.
    return () => {
      Object.values(timeoutIdsRef.current).forEach(timeoutId => clearTimeout(timeoutId));
      timeoutIdsRef.current = {};
    };
  }, [notifications, autoDismissDuration, dispatch]);

  return (
    <>
      <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2">
        {notifications.map(notification => (
          <div key={notification.id} className="flex items-center p-4 bg-gray-800 text-white rounded shadow-lg">
            <span className="flex-grow">{notification.message}</span>
            <button
              onClick={() => {
                // Manually dismiss the notification on click
                dispatch(remove_notification(notification.id));
                if (timeoutIdsRef.current[notification.id]) {
                  clearTimeout(timeoutIdsRef.current[notification.id]);
                  delete timeoutIdsRef.current[notification.id];
                }
              }}
              className="ml-4 focus:outline-none"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </>
  );
};

export default GV_NotificationBar;