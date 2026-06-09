import { message } from "antd";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { SetUser } from "../redux/usersSlice.js";
import { useNavigate } from "react-router-dom";
import { HideLoading, ShowLoading } from "../redux/loaderSlice";
import axios from "axios";
import config from "../config";

// Axios Instance with Token
const axiosInstance = axios.create({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

// Get user info
export const getUserInfo = async () => {
  try {
    const response = await axiosInstance.post(`${config.backendUrl}/api/exams/get-user-info`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
}

function ProtectedRoute({ children }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const getUserData = async () => {
    try {
      dispatch(ShowLoading());
      const response = await getUserInfo();
      dispatch(HideLoading());
      if (response.success) {
        dispatch(SetUser(response.data));
      } else {
        message.error(response.message);
        navigate("/login");
      }
    } catch (error) {
      navigate("/login");
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("token")) {
      getUserData();
    } else {
      navigate("/login");
    }
  }, []);

  return (
    <div className="layout">
      <div className="body">
        <div className="flex justify-between header">
          <h1 className="text-2xl text-white">QUIZ Application</h1>
        </div>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}

export default ProtectedRoute;
