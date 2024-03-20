import React, { useState, useEffect } from "react";

// MUI
import {
  Box,
  Typography,
  Button,
  Divider,
  Link,
  Paper,
  Grid,
} from "@mui/material";
import { useParams, Outlet, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useSnackbar } from "notistack";
import { httpClient } from "../../../client";
import LoadingSpinner from "../../widgets/LoadingSpinner";

const PanelPage = () => {
  const { panelId } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.user);
  const [panel, setPanel] = useState(null);

  const menus = [
    {
      title: "Submit Questions",
      path: "question",
      objectKey: "QuestionStageDeadline",
    },
    { title: "Tag Questions", path: "tagging", objectKey: "TagStageDeadline" },
    { title: "Vote Questions", path: "voting", objectKey: "VoteStageDeadline" },
  ];

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user?.token}`,
  };

  useEffect(() => {
    httpClient
      .get(`/panel/${panelId}`, {
        headers,
      })
      .then((response) => {
        setPanel(response.data);
      })
      .catch((error) =>
        enqueueSnackbar(error.message, {
          variant: "error",
        })
      );
  }, []);

  if (!panel) {
    return <LoadingSpinner />;
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography
        variant="h4"
        mt={2}
        textAlign="center"
        sx={{ fontFamily: "monospace", fontWeight: "bold" }}
      >
        {panel.PanelName}
      </Typography>
      <Typography
        variant="h6"
        mx={2}
        textAlign="left"
        sx={{ fontWeight: "bold" }}
      >
        Description:
      </Typography>
      <Typography mx={2}> {panel.PanelDesc} </Typography>
      <Typography
        variant="h6"
        mx={2}
        textAlign="left"
        sx={{ fontWeight: "bold" }}
      >
        Panelist:
      </Typography>
      <Typography mx={2}>{panel.Panelist}</Typography>
      <Typography
        variant="h6"
        mx={2}
        textAlign="left"
        sx={{ fontWeight: "bold" }}
      >
        Presentation Date:
      </Typography>
      <Typography mx={2}>
        {new Date(panel.PanelPresentationDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </Typography>
      <Typography
        variant="h6"
        mx={2}
        textAlign="left"
        sx={{ fontWeight: "bold" }}
      >
        Number of questions:
      </Typography>
      <Typography mx={2}>{panel.NumberOfQuestions}</Typography>
      <br />
      <Typography mx={2} textAlign="left" sx={{ fontWeight: "bold" }}>
        Link to the Video: <span />
        <Link
          href={panel.PanelVideoLink}
          underline="hover"
          target="_blank"
          rel="noopener"
        >
          {panel.PanelVideoLink}
        </Link>
      </Typography>
      <br />
      <Divider />
      <br />
      <Grid container spacing={2} mx={2} width={"97%"}>
        {menus.map((menu) => {
          return (
            <Grid item xs={2} md={4}>
              <Paper elevation={3} align="center">
                <br />
                <Typography variant="h6">{menu.title}</Typography>
                <Typography>
                  Deadline{" "}
                  {new Date(panel[menu.objectKey]).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Typography>
                <br />
                <Divider />
                <br />
                <Button variant="contained" onClick={() => navigate(menu.path)}>
                  Go to
                </Button>
                <br />
                <br />
              </Paper>
            </Grid>
          );
        })}

        <Grid item xs={8}>
          <Paper elevation={3} align="center">
            <Outlet />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PanelPage;
