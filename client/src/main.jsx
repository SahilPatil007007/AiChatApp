import React, { Children } from 'react'
import ReactDOM from 'react-dom/client'
//import App from './App.jsx'
import './index.css'
import Homepage from './routes/homepage/Homepage';
import DashboardPage from './routes/dashboardPage/DashboardPage';
import ChatPage from './routes/chatPage/ChatPage';
import RootLayout from './layouts/rootLayout/RootLayout';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import DashboardLayout from './layouts/dashboardLayout/dashboardLayout';
import SignInPage from './routes/signInPage/SignInPage';
import SignUpPage from './routes/signUpPage/SignUpPage';


const router = createBrowserRouter([
  {
    element: <RootLayout/>,
    children:[
      {
        path: "/",
        element: <Homepage /> //It goes to the RootLayout in <Outlet/>
      },
      {
        path: "/sign-in/*",
        element: <SignInPage /> //It goes to the RootLayout in <Outlet/>
      },
      {
        path: "/sign-up/*",
        element: <SignUpPage /> //It goes to the RootLayout in <Outlet/>
      },
      {
        element: <DashboardLayout />, //It goes to RootLayout 
        children:[
          {
            path:"/dashboard",
            element: <DashboardPage/> //It goes to DashboardLayout
          },
          {
            path: "/dashboard/chats/:id",//It goes to DashboardLayout
            element: <ChatPage/>
          }
        ]
      }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)