import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Remove default browser styles
document.body.style.margin = 0;
document.body.style.padding = 0;
document.body.style.height = '100vh';
document.body.style.width = '100vw';
document.body.style.background = 'linear-gradient(135deg, #4F73FF, #4BC0C8)';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
