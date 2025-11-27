// utils/proDashboard.js

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
        body {
          margin: 0;
          font-family: "Inter", sans-serif;
          background: linear-gradient(135deg, #0f0f29, #1b1b3a, #24243e);
          background-size: 400% 400%;
          animation: gradientBG 12s ease infinite;
          color: white;
        }

        @keyframes gradientBG {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .container {
          text-align: center;
          padding: 80px 20px;
          animation: fadeIn 1.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        h1 {
          font-size: 52px;
          font-weight: 700;
          margin-bottom: 10px;
        }

        p.subtitle {
          font-size: 18px;
          opacity: 0.8;
          margin-bottom: 40px;
        }

        .glass-card {
          width: 500px;
          margin: 0 auto;
          padding: 30px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(14px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.25);
          animation: fadeIn 1.6s ease;
        }

        .glass-card h3 {
          margin-top: 0;
          font-size: 22px;
          margin-bottom: 20px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
          font-size: 16px;
        }

        .footer {
          margin-top: 40px;
          opacity: 0.6;
          font-size: 14px;
        }
      </style>
  </head>

  <body>
    <div class="container">
        <h1><i class="fa-solid fa-server icon"></i> KIVELO API</h1>
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
                <span>API Base URL:</span>
                <span>/api</span>
            </div>
        </div>

        <div class="footer">© ${new Date().getFullYear()} Kivelo — All rights reserved.</div>
    </div>
  </body>
  </html>`;
};

export default getProDashboard;
