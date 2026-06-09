import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

import ActiveSectionContextProvider from './hero/curriculumContext/active-section-context';
import store from "./Quiz/redux/store";
import { Provider } from "react-redux";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
  <ActiveSectionContextProvider>
    <App />
  </ActiveSectionContextProvider>
  </Provider>
);


