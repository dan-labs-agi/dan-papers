import React from 'react';
import './src/index.css';

import ReactDOM from 'react-dom/client';
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { AuthProvider } from "./src/context/AuthContext";
import App from './App';
import { convex } from "./src/lib/convex";

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ConvexAuthProvider client={convex}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ConvexAuthProvider>
  </React.StrictMode>
);
