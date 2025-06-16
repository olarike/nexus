const { createServer } = require('http');
const next = require('next');

// Get port from environment variable or default to 3000
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Create the Next.js app
const app = next({ dev: false });
const handle = app.getRequestHandler();

// Start the server
app.prepare()
  .then(() => {
    // Create HTTP server
    const server = createServer((req, res) => {
      handle(req, res);
    });

    // Start listening
    server.listen(port, '0.0.0.0', (err) => {
      if (err) {
        console.error('Error starting server:', err);
        process.exit(1);
      }
      console.log(`> Server is running on http://0.0.0.0:${port}`);
    });

    // Handle server errors
    server.on('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    });

    // Handle process termination
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
  })
  .catch((err) => {
    console.error('Error during server startup:', err);
    process.exit(1);
  }); 