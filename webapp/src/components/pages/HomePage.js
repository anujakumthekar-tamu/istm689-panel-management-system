import React, { useState } from "react";
// MUI
import { Box, Button, Typography, Snackbar } from "@mui/material";
// Redux
import { useSelector } from "react-redux";
// HTTP Client
import { httpClient } from "../../client";
// React Router
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();
  const [isSnackbarOpen, setIsSnackbarOpen] = useState(false);
  const [apiResponse, setApiResponse] = useState("");
  const [isApiWaiting, setIsApiWaiting] = useState(false);

  const { user } = useSelector((state) => state.user);

  const handleOnClick = () => {
    setIsApiWaiting(true);
    httpClient
      .get("/")
      .then((response) =>
        setApiResponse(JSON.stringify(response?.data, null, 2))
      )
      .catch((err) => setApiResponse(JSON.stringify(err.message, null, 2)))
      .finally(() => {
        setIsSnackbarOpen(true);
        setIsApiWaiting(false);
      });
  };

  const handleOnClickUser = () => {
    setIsApiWaiting(true);
    httpClient
      .get("/user", {
        headers: {
          Authorization: `Bearer ${user?.raw_token}`,
          "Content-Type": "application/json",
        },
      })
      .then((response) =>
        setApiResponse(JSON.stringify(response?.data, null, 2))
      )
      .catch((err) => setApiResponse(JSON.stringify(err.message, null, 2)))
      .finally(() => {
        setIsApiWaiting(false);
        setIsSnackbarOpen(true);
      });
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4">This is the HomePage component.</Typography>
      <Typography>Test API Call to backend!</Typography>
      <Button
        variant="contained"
        onClick={handleOnClick}
        disabled={isApiWaiting}
      >
        Call Public API Route
      </Button>
      <p></p>
      <Button
        variant="contained"
        onClick={handleOnClickUser}
        disabled={isApiWaiting}
      >
        Call Fetch Users
      </Button>
      <p></p>
      <Button variant="outlined" onClick={() => navigate("/question")}>
        Go to Question Page
      </Button>

      <Snackbar
        open={isSnackbarOpen}
        onClose={() => setIsSnackbarOpen(false)}
        autoHideDuration={3000}
        message={apiResponse}
      />
    </Box>
  );
};

export default HomePage;
