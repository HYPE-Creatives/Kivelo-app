export default function getNotFoundPage(path) {
  return `
    <html>
      <head>
        <title>KIVELO API – 404 Not Found</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background: #f4f6f9;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 800px;
            margin: 80px auto;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            text-align: center;
          }
          h1 {
            color: #d9534f;
            font-size: 32px;
            margin-bottom: 10px;
          }
          p {
            color: #555;
            font-size: 18px;
          }
          .path {
            font-family: monospace;
            background: #eee;
            padding: 8px 12px;
            border-radius: 6px;
            display: inline-block;
            margin: 10px 0;
            font-size: 16px;
            color: #333;
          }
          a {
            display: inline-block;
            margin-top: 20px;
            background: #4e73df;
            color: white;
            text-decoration: none;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 16px;
          }
          a:hover {
            background: #2e59d9;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>404 – Route Not Found</h1>
          <p>The requested API endpoint does not exist:</p>
          <div class="path">${path}</div>
          <p>Please check your request or return to the API dashboard.</p>
          <a href="/api">Go to API Overview</a>
        </div>
      </body>
    </html>
  `;
}
