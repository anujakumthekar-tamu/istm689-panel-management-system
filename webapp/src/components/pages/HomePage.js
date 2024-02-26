import React, { useState } from "react";
// MUI
import { Box, Button, Typography, Snackbar } from "@mui/material";
// Redux
import { useSelector } from "react-redux";
// HTTP Client
import { httpClient } from "../../client";

const HomePage = () => {
  const [isSnackbarOpen, setIsSnackbarOpen] = useState(false);
  const [apiResponse, setApiResponse] = useState("");
  const [isApiWaiting, setIsApiWaiting] = useState(false);
  const [selectedHowdyFile, SetSelectedHowdyFile] = useState("");

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

  const handleOnClickPrivate = () => {
    setIsApiWaiting(true);
    httpClient
      .get("/protected", {
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

  const sendCSVToServer = (csvData) => {
    setIsApiWaiting(true);
    httpClient
      .post("/howdycsv", csvData, {
        headers: {
          Authorization: `Bearer ${user?.raw_token}`,
          "Content-Type": "text/plain",
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

  const handleHowdyCSVUpload = () => {
    if (selectedHowdyFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvData = e.target.result;
        sendCSVToServer(csvData);
      };
      reader.readAsText(selectedHowdyFile);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      SetSelectedHowdyFile(file);
    }
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
        onClick={handleOnClickPrivate}
        disabled={isApiWaiting}
      >
        Call Private API Route
      </Button>
      <div>
        <input type="file" onChange={handleFileChange} />
        <Button
          variant="contained"
          onClick={handleHowdyCSVUpload}
          disabled={isApiWaiting}
        >
          Upload Howdy CSV
        </Button>
      </div>

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
