import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * AuthCallback component displays a loading state during the authentication redirect process.
 * This page is shown when users are redirected back from the authentication provider.
 */
function AuthCallback() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
      }}
    >
      <CircularProgress size={60} />
      <Typography variant="h5" component="h1">
        Completing Login
      </Typography>
    </Box>
  );
}

export default AuthCallback;
