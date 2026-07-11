import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import fs from "fs/promises";
import { existsSync } from "fs";
import { defaultSiteData } from "./default-site-data";

// Load environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON requests with 10MB limit for image uploads
  app.use(express.json({ limit: "10mb" }));

  // CORS Middleware to allow requests from external deployments like Vercel and local development
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });

  const SITE_DATA_FILE = path.join(process.cwd(), "site-data.json");
  const SUBMISSIONS_FILE = path.join(process.cwd(), "contact-submissions.json");
  const UPLOADS_DIR = path.join(process.cwd(), "uploads");

  // Ensure uploads directory exists
  if (!existsSync(UPLOADS_DIR)) {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  }

  const ADMIN_TOKEN = "admin-session-xyz-123";

  // Authorization Middleware
  const checkAdminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${ADMIN_TOKEN}`) {
      return res.status(401).json({ success: false, message: "Unauthorized. Admin session required." });
    }
    next();
  };

  // Serve uploads statically
  app.use("/uploads", express.static(UPLOADS_DIR));

  // GET site data
  app.get("/api/site-data", async (req, res) => {
    try {
      if (!existsSync(SITE_DATA_FILE)) {
        await fs.writeFile(SITE_DATA_FILE, JSON.stringify(defaultSiteData, null, 2), "utf-8");
        return res.json(defaultSiteData);
      }
      const rawData = await fs.readFile(SITE_DATA_FILE, "utf-8");
      const parsed = JSON.parse(rawData);
      return res.json(parsed);
    } catch (err: any) {
      console.error("Error loading site data:", err);
      return res.status(500).json({ success: false, message: "Failed to load site data." });
    }
  });

  // POST save site data
  app.post("/api/site-data", checkAdminAuth, async (req, res) => {
    try {
      const newData = req.body;
      if (!newData || typeof newData !== "object") {
        return res.status(400).json({ success: false, message: "Invalid site data payload." });
      }
      await fs.writeFile(SITE_DATA_FILE, JSON.stringify(newData, null, 2), "utf-8");
      return res.json({ success: true, message: "Site data saved successfully!" });
    } catch (err: any) {
      console.error("Error saving site data:", err);
      return res.status(500).json({ success: false, message: "Failed to save site data." });
    }
  });

  // Admin Login
  app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;
    if (username === "animenova" && password === "Harish311*") {
      return res.json({ success: true, token: ADMIN_TOKEN });
    }
    return res.status(401).json({ success: false, message: "Invalid username or password." });
  });

  // GET submissions
  app.get("/api/admin/submissions", checkAdminAuth, async (req, res) => {
    try {
      if (!existsSync(SUBMISSIONS_FILE)) {
        return res.json([]);
      }
      const rawSubs = await fs.readFile(SUBMISSIONS_FILE, "utf-8");
      return res.json(JSON.parse(rawSubs));
    } catch (err: any) {
      console.error("Error reading submissions:", err);
      return res.status(500).json({ success: false, message: "Failed to load submissions." });
    }
  });

  // DELETE submission
  app.delete("/api/admin/submissions/:id", checkAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      if (!existsSync(SUBMISSIONS_FILE)) {
        return res.json({ success: true });
      }
      const rawSubs = await fs.readFile(SUBMISSIONS_FILE, "utf-8");
      const submissions = JSON.parse(rawSubs);
      const filtered = submissions.filter((sub: any) => sub.id !== id);
      await fs.writeFile(SUBMISSIONS_FILE, JSON.stringify(filtered, null, 2), "utf-8");
      return res.json({ success: true });
    } catch (err: any) {
      console.error("Error deleting submission:", err);
      return res.status(500).json({ success: false, message: "Failed to delete submission." });
    }
  });

  // Image upload base64
  app.post("/api/admin/upload", checkAdminAuth, async (req, res) => {
    try {
      const { filename, data } = req.body;
      if (!filename || !data) {
        return res.status(400).json({ success: false, message: "Missing filename or base64 data." });
      }

      const safeFilename = path.basename(filename).replace(/[^a-zA-Z0-9.-]/g, "_");
      const uniqueFilename = `${Date.now()}_${safeFilename}`;
      const filePath = path.join(UPLOADS_DIR, uniqueFilename);

      const base64Data = data.replace(/^data:image\/\w+;base64,/, "");
      await fs.writeFile(filePath, Buffer.from(base64Data, "base64"));

      return res.json({
        success: true,
        url: `/uploads/${uniqueFilename}`
      });
    } catch (err: any) {
      console.error("Error in file upload:", err);
      return res.status(500).json({ success: false, message: "Failed to upload image." });
    }
  });

  // API Route for securely sending emails and saving contact form submissions
  app.post("/api/contact", async (req, res) => {
    const { name, email, phone, subject, message } = req.body;

    // 1. Validate fields
    if (!name || !email || !phone || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: "Please fill out all required fields." 
      });
    }

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: "Please enter a valid email address." 
      });
    }

    try {
      // Save submission to contact-submissions.json
      let submissions = [];
      if (existsSync(SUBMISSIONS_FILE)) {
        try {
          const rawSubs = await fs.readFile(SUBMISSIONS_FILE, "utf-8");
          submissions = JSON.parse(rawSubs);
        } catch (e) {
          console.error("Error reading submissions:", e);
        }
      }
      
      const newSubmission = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        email,
        phone,
        subject,
        message,
        timestamp: new Date().toLocaleString()
      };
      
      submissions.unshift(newSubmission);
      await fs.writeFile(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2), "utf-8");

      const toEmail = process.env.CONTACT_TO_EMAIL || "nagi21048@gmail.com";
      const resendApiKey = process.env.RESEND_API_KEY;

      if (resendApiKey) {
        // Option A: Send via Resend API
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Portfolio Contact <onboarding@resend.dev>",
            to: toEmail,
            reply_to: email,
            subject: `[Portfolio Contact] ${subject}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #EF233C; margin-top: 0;">New Contact Form Message</h2>
                <p><strong>Sender's Name:</strong> ${name}</p>
                <p><strong>Sender's Email Address:</strong> <a href="mailto:${email}">${email}</a></p>
                <p><strong>Mobile Number:</strong> ${phone}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <p style="white-space: pre-wrap; background-color: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 4px solid #EF233C; line-height: 1.6;">${message}</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #999; margin-bottom: 0;">Date and Time of Submission: ${new Date().toLocaleString()}</p>
              </div>
            `,
          }),
        });

        const resData = await response.json() as any;

        if (!response.ok) {
          throw new Error(resData.message || `Resend API returned status ${response.status}`);
        }

        return res.json({ 
          success: true, 
          message: "Your message has been sent successfully via Resend!" 
        });
      } else {
        // Option B: Server-side secure proxy to FormSubmit to hide user's actual email address
        const response = await fetch(`https://formsubmit.co/ajax/${toEmail}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({
            "Full Name": name,
            "Email Address": email,
            "Mobile Number": phone,
            "Subject": subject,
            "Message": message,
            "Submission Date & Time": new Date().toLocaleString(),
            "_subject": `Portfolio Contact Form: ${subject}`,
          }),
        });

        if (!response.ok) {
          throw new Error(`FormSubmit service returned status ${response.status}`);
        }

        const result = await response.json() as any;
        if (result.success === "false" || !result.success) {
          throw new Error(result.message || "Failed to deliver email through FormSubmit.");
        }

        return res.json({ 
          success: true, 
          message: "Your message has been sent successfully!" 
        });
      }
    } catch (err: any) {
      console.error("Error in /api/contact:", err);
      return res.status(500).json({ 
        success: false, 
        message: err.message || "Unable to deliver your message. Please try again later." 
      });
    }
  });

  // Serve static assets & Vite in dev/prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
  app.get("/", (req, res) => {
    res.json({
      success: true,
      message: "Backend API is running successfully."
    });
  });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
