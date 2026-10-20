const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

// --- Database Connection (Serverless Cached) ---
let isConnected = false;
async function connectDB() {
    if (isConnected) return;
    try {
        const db = await mongoose.connect(process.env.MONGODB_URI, { maxPoolSize: 10 });
        isConnected = db.connections[0].readyState === 1;
    } catch (error) {
        console.error('MongoDB connection error:', error);
    }
}

// --- MongoDB Schema ---
const bookingSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    email: { type: String, trim: true, maxlength: 100 },
    address: { type: String, required: true, trim: true, maxlength: 250 },
    serviceType: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    description: { type: String, trim: true, maxlength: 1000 },
    status: { type: String, default: 'Pending', enum: ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'] }
}, { timestamps: true });

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

// --- Public HTML & CSS (80:15:5 Design System) ---
const publicHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Apex Roofing & Construction | Professional Contractors</title>
    <meta name="description" content="Expert roofing, repair, and construction services. Book a free estimate with Apex Roofing today.">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap" rel="stylesheet">
    <style>
        /* 80% Soft Flat Design */
        :root {
            --bg: #FDFBF7;
            --text: #2D3142;
            --orange: #F05D23;
            --blue: #1C3144;
            --light-blue: #E8EEF2;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
        body { background-color: var(--bg); color: var(--text); line-height: 1.6; overflow-x: hidden; }
        h1, h2, h3 { color: var(--blue); font-weight: 800; }
        a { text-decoration: none; color: inherit; }
        section { padding: 80px 20px; max-width: 1200px; margin: 0 auto; }
        
        /* 15% Glassmorphism */
        .glass {
            background: rgba(255, 255, 255, 0.65);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.4);
            border-radius: 20px;
        }
        .nav-glass { position: fixed; top: 10px; left: 50%; transform: translateX(-50%); width: 95%; max-width: 1200px; z-index: 1000; padding: 15px 30px; display: flex; justify-content: space-between; align-items: center; }
        
        /* 5% Claymorphism */
        .clay-btn {
            background: var(--orange); color: #FFF; padding: 12px 24px; border-radius: 14px; font-weight: 600; border: none; cursor: pointer;
            box-shadow: 6px 6px 12px #d9d6d1, -6px -6px 12px #ffffff; transition: all 0.2s ease-in-out;
        }
        .clay-btn:hover { transform: translateY(-2px); }
        .clay-btn:active { box-shadow: inset 4px 4px 8px #cc4f1e, inset -4px -4px 8px #ff6b28; transform: translateY(0); }
        .clay-card {
            background: var(--bg); border-radius: 20px; padding: 30px;
            box-shadow: 8px 8px 16px #e6e4df, -8px -8px 16px #ffffff;
        }

        /* Layouts */
        .hero { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--light-blue) 0%, var(--bg) 100%); text-align: center; padding-top: 100px; }
        .hero h1 { font-size: 3.5rem; margin-bottom: 20px; line-height: 1.2; }
        .hero p { font-size: 1.2rem; margin-bottom: 30px; color: #555; max-width: 600px; margin-inline: auto; }
        
        .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; }
        .service-icon { font-size: 2.5rem; margin-bottom: 15px; }
        
        .form-group { margin-bottom: 20px; text-align: left; }
        .form-group label { display: block; font-weight: 600; margin-bottom: 8px; font-size: 0.9rem; }
        .form-control { width: 100%; padding: 12px 15px; border-radius: 12px; border: 1px solid #ddd; background: #fff; font-size: 1rem; outline: none; transition: 0.3s; }
        .form-control:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(28,49,68,0.1); }
        
        footer { background: var(--blue); color: white; padding: 60px 20px; text-align: center; }
        footer a { color: var(--orange); }

        #alert { display: none; padding: 15px; border-radius: 12px; margin-bottom: 20px; font-weight: 600; }
        .alert-success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .alert-error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }

        @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; scroll-behavior: auto !important; } }
        @media (max-width: 768px) { .hero h1 { font-size: 2.5rem; } .nav-links { display: none; } }
    </style>
    <!-- Local Business Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "RoofingContractor",
      "name": "[Apex Roofing & Construction]",
      "telephone": "[+1-555-123-4567]",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "[123 Construction Blvd]",
        "addressLocality": "[City Name]",
        "addressRegion": "[State]",
        "postalCode": "[00000]",
        "addressCountry": "[US]"
      }
    }
    </script>
</head>
<body>

    <nav class="glass nav-glass">
        <div style="font-weight: 800; font-size: 1.2rem; color: var(--blue);">APEX ROOFING</div>
        <div class="nav-links" style="display: flex; gap: 20px; font-weight: 600;">
            <a href="#services">Services</a>
            <a href="#about">About</a>
            <a href="#booking">Book Estimate</a>
        </div>
        <div>
            <a href="tel:[+15551234567]" class="clay-btn" style="background: var(--blue);">Call Now</a>
        </div>
    </nav>

    <header class="hero">
        <div class="glass" style="padding: 60px 40px; max-width: 800px; width: 90%;">
            <h1>Protecting Your Home, From the Top Down.</h1>
            <p>Premium roofing repairs, full replacements, and expert construction services across [Your Service Area]. Built to last, designed to impress.</p>
            <a href="#booking" class="clay-btn" style="display: inline-block; font-size: 1.1rem;">Book a Free Estimate</a>
        </div>
    </header>

    <section id="services">
        <h2 style="text-align: center; margin-bottom: 40px; font-size: 2.5rem;">Our Expert Services</h2>
        <div class="grid-3">
            <div class="clay-card">
                <div class="service-icon">🏠</div>
                <h3>Roof Replacement</h3>
                <p>Complete tear-offs and installations using premium architectural shingles, metal, or flat roofing materials.</p>
            </div>
            <div class="clay-card">
                <div class="service-icon">🔧</div>
                <h3>Leak Repair</h3>
                <p>Fast, reliable emergency repairs to stop leaks, replace damaged flashing, and secure your home's integrity.</p>
            </div>
            <div class="clay-card">
                <div class="service-icon">🌧️</div>
                <h3>Gutters & Siding</h3>
                <p>Seamless gutter installations and high-quality siding to protect your property from water damage.</p>
            </div>
        </div>
    </section>

    <section id="about" style="background: var(--light-blue); max-width: 100%; padding: 80px 20px;">
        <div style="max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center;">
            <div class="clay-card">
                <h2>Why Choose Apex?</h2>
                <p style="margin-top: 15px; margin-bottom: 15px;">With over 15 years of experience, we provide transparent pricing, licensed professionals, and unparalleled craftsmanship. We treat every home as if it were our own.</p>
                <ul style="list-style-position: inside; font-weight: 600;">
                    <li>✓ Fully Licensed & Insured</li>
                    <li>✓ Honest, Upfront Pricing</li>
                    <li>✓ Premium Grade Materials</li>
                    <li>✓ 10-Year Workmanship Warranty</li>
                </ul>
            </div>
            <div class="glass" style="height: 300px; background-image: url('https://images.unsplash.com/photo-1605810230434-7631ac76ec81?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'); background-size: cover; background-position: center;"></div>
        </div>
    </section>

    <section id="booking">
        <div class="glass" style="max-width: 700px; margin: 0 auto; padding: 40px;">
            <h2 style="text-align: center; margin-bottom: 10px;">Request a Quote</h2>
            <p style="text-align: center; margin-bottom: 30px; color: #555;">Fill out the details below and our team will contact you to confirm your appointment.</p>
            
            <div id="alert"></div>

            <form id="bookingForm">
                <div class="grid-3" style="grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div class="form-group">
                        <label>Full Name *</label>
                        <input type="text" id="name" class="form-control" required placeholder="John Doe">
                    </div>
                    <div class="form-group">
                        <label>Phone Number *</label>
                        <input type="tel" id="phone" class="form-control" required placeholder="(555) 123-4567">
                    </div>
                </div>
                <div class="grid-3" style="grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div class="form-group">
                        <label>Email Address</label>
                        <input type="email" id="email" class="form-control" placeholder="john@example.com">
                    </div>
                    <div class="form-group">
                        <label>Service Needed *</label>
                        <select id="serviceType" class="form-control" required>
                            <option value="">Select a service...</option>
                            <option value="Roof Replacement">Roof Replacement</option>
                            <option value="Roof Repair">Roof Repair</option>
                            <option value="Inspection">Free Inspection</option>
                            <option value="Gutters/Siding">Gutters & Siding</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Property Address *</label>
                    <input type="text" id="address" class="form-control" required placeholder="123 Main St, City, ZIP">
                </div>
                <div class="grid-3" style="grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div class="form-group">
                        <label>Preferred Date *</label>
                        <input type="date" id="date" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Preferred Time *</label>
                        <input type="time" id="time" class="form-control" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Project Details (Optional)</label>
                    <textarea id="description" class="form-control" rows="3" placeholder="Briefly describe the issue..."></textarea>
                </div>
                <button type="submit" class="clay-btn" style="width: 100%; font-size: 1.1rem; padding: 15px;" id="submitBtn">Submit Booking Request</button>
            </form>
        </div>
    </section>

    <footer>
        <h2 style="color: white; margin-bottom: 15px;">[Apex Roofing & Construction]</h2>
        <p>Email: <a href="mailto:[info@apexroofing.placeholder.com]">[info@apexroofing.placeholder.com]</a> | Phone: <a href="tel:[+15551234567]">[+1 (555) 123-4567]</a></p>
        <p style="margin-top: 10px;">Address: [123 Construction Blvd, City Name, State 00000]</p>
        <div style="margin-top: 30px; opacity: 0.7; font-size: 0.9rem;">
            &copy; 2024 [Apex Roofing & Construction]. All rights reserved.
        </div>
    </footer>

    <script>
        document.getElementById('bookingForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('submitBtn');
            const alertBox = document.getElementById('alert');
            btn.innerText = 'Submitting...';
            btn.disabled = true;

            const payload = {
                name: document.getElementById('name').value,
                phone: document.getElementById('phone').value,
                email: document.getElementById('email').value,
                address: document.getElementById('address').value,
                serviceType: document.getElementById('serviceType').value,
                date: document.getElementById('date').value,
                time: document.getElementById('time').value,
                description: document.getElementById('description').value,
            };

            try {
                const res = await fetch('/api/bookings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                const data = await res.json();
                alertBox.style.display = 'block';
                
                if (res.ok) {
                    alertBox.className = 'alert-success';
                    alertBox.innerText = 'Success! Your booking request has been received.';
                    document.getElementById('bookingForm').reset();
                } else {
                    alertBox.className = 'alert-error';
                    alertBox.innerText = data.error || 'Something went wrong. Please try again.';
                }
            } catch (err) {
                alertBox.style.display = 'block';
                alertBox.className = 'alert-error';
                alertBox.innerText = 'Network error. Please try again later.';
            } finally {
                btn.innerText = 'Submit Booking Request';
                btn.disabled = false;
            }
        });

        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                document.querySelector(this.getAttribute('href')).scrollIntoView({ behavior: 'smooth' });
            });
        });
    </script>
</body>
</html>
`;

// --- Routes ---
app.get('/', (req, res) => {
    res.send(publicHTML);
});

app.post('/api/bookings', async (req, res) => {
    await connectDB();
    try {
        const newBooking = new Booking(req.body);
        await newBooking.save();
        res.status(201).json({ success: true, bookingId: newBooking._id });
    } catch (error) {
        res.status(400).json({ error: 'Invalid data submitted. Please check your inputs.' });
    }
});

module.exports = app;
