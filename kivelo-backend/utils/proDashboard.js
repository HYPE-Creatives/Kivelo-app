const getProDashboard = (title) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>

      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">

      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: "Inter", sans-serif;
          background: linear-gradient(135deg, #0f0f29, #1b1b3a, #24243e);
          background-size: 400% 400%;
          animation: gradientBG 12s ease infinite;
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 20px;
        }

        @keyframes gradientBG {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .wrapper {
          max-width: 650px;
          width: 100%;
          text-align: center;
          animation: fadeIn 1.2s ease-in-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        h1 {
          font-size: clamp(32px, 6vw, 52px);
          font-weight: 700;
          margin-bottom: 10px;
          line-height: 1.2;
        }

        p.subtitle {
          font-size: clamp(16px, 3.5vw, 20px);
          opacity: 0.8;
          margin-bottom: 35px;
        }

        .glass-card {
          width: 100%;
          padding: 30px 22px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(14px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.25);
          margin-bottom: 30px;
        }

        .glass-card h3 {
          font-size: 20px;
          margin-bottom: 18px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          font-size: 16px;
          margin: 10px 0;
          opacity: 0.9;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #6dd5fa;
          color: #0f0f29;
          padding: 14px 22px;
          font-size: 16px;
          font-weight: 600;
          text-decoration: none;
          border-radius: 12px;
          transition: 0.3s ease;
        }

        .btn i {
          font-size: 18px;
        }

        .btn:hover {
          background: #a6e8ff;
          transform: translateY(-3px);
        }

        .footer {
          margin-top: 20px;
          font-size: 14px;
          opacity: 0.6;
        }

        /* Mobile Adjustments */
        @media (max-width: 500px) {
          .info-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
        }
      </style>
  </head>

  <body>
    <div class="wrapper">
        <h1><i class="fa-solid fa-server"></i> KIVELO API</h1>
        <p class="subtitle">Powering the next generation of wellness technology.</p>

        <div class="glass-card">
            <h3><i class="fa-solid fa-circle-info"></i> System Information</h3>

            <div class="info-row">
              <span>Environment:</span>
              <span>${process.env.NODE_ENV || "development"}</span>
            </div>

            <div class="info-row">
              <span>Status:</span>
              <span style="color:#4cd137; font-weight:600;">Running</span>
            </div>

            <div class="info-row">
              <span>Timestamp:</span>
              <span>${new Date().toLocaleString()}</span>
            </div>

            <div class="info-row">
              <span>API Docs:</span>
              <span><a href="/api-docs/v1" style="color:#6dd5fa; text-decoration:none;">Swagger</a></span>
            </div>
            <div class="info-row">
              <span>API Analytics:</span>
              <span><a href="/api-analytics/v1" style="color:#6dd5fa; text-decoration:none;">Analytics Dashboard</a></span>
            </div>
        </div>

        <a href="/api-docs/v1" class="btn">
          <i class="fa-solid fa-book"></i> Open API Documentation
        </a>

        <div class="footer">© ${new Date().getFullYear()} KIVELO — All rights reserved.</div>
    </div>
  </body>
  </html>`;
};

export default getProDashboard;
