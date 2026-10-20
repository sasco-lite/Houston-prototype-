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
// Schema updated with required fields from the document: zip, property type, lead source, and expanded project stages.[span_0](start_span)[span_0](end_span)
const bookingSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    email: { type: String, trim: true, maxlength: 100 },
    address: { type: String, required: true, trim: true, maxlength: 250 },
    zip: { type: String, required: true, trim: true, maxlength: 20 },
    propertyType: { type: String, required: true },
    serviceType: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    description: { type: String, trim: true, maxlength: 1000 },
    leadSource: { type: String, trim: true },
    consent: { type: Boolean, required: true },
    status: { 
        type: String, 
        default: 'Request received', 
        enum: [
            'Request received', 'Inspection scheduled', 'Inspection complete', 
            'Estimate delivered', 'Agreement signed', 'Permits and materials', 
            'Install scheduled', 'Work in progress', 'Final inspection', 
            'Warranty registered', 'Complete'
        ] 
    }
}, { timestamps: true });

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

// --- Public HTML & CSS (80:15:5 Design System) ---
const publicHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Houston Roofing & Construction | Roof Replacement, Repair & Inspections[span_1](start_span)[span_1](end_span)</title>
    <meta name="description" content="Residential, commercial and multi-family roofing in Houston; book a free inspection online and track the project from your dashboard.[span_2](start_span)[span_2](end_span)">
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
        h1, h2, h3, h4 { color: var(--blue); font-weight: 800; }
        a { text-decoration: none; color: inherit; }
        section { padding: 80px 20px; max-width: 1200px; margin: 0 auto; }
        
        /* 15% Glassmorphism */
        .glass {
            background: rgba(255, 255, 255, 0.75);
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
        .hero .eyebrow { font-weight: 600; color: var(--orange); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; display: block; }
        .hero p { font-size: 1.2rem; margin-bottom: 30px; color: #555; max-width: 700px; margin-inline: auto; }
        
        .grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 30px; }
        .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; }
        
        .form-group { margin-bottom: 20px; text-align: left; }
        .form-group label { display: block; font-weight: 600; margin-bottom: 8px; font-size: 0.9rem; }
        .form-control { width: 100%; padding: 12px 15px; border-radius: 12px; border: 1px solid #ddd; background: #fff; font-size: 1rem; outline: none; transition: 0.3s; }
        .form-control:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(28,49,68,0.1); }
        
        footer { background: var(--blue); color: white; padding: 60px 20px; text-align: center; }
        footer a { color: var(--orange); }
        .legal-notice { font-size: 0.85rem; opacity: 0.8; max-width: 800px; margin: 30px auto 0; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 20px; }

        #alert { display: none; padding: 15px; border-radius: 12px; margin-bottom: 20px; font-weight: 600; }
        .alert-success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .alert-error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }

        @media (max-width: 768px) { .hero h1 { font-size: 2.5rem; } .nav-links { display: none; } .grid-2 { grid-template-columns: 1fr; } }
    </style>
    <!-- Local Business Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "RoofingContractor",
      "name": "Houston Roofing & Construction",
      "telephone": "+1 832-237-3737",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "11330 West Rd",
        "addressLocality": "Houston",
        "addressRegion": "TX",
        "postalCode": "77065",
        "addressCountry": "US"
      },
      "areaServed": [
        "Harris", "Montgomery", "Fort Bend", "Brazoria", "Galveston", "Waller", "Liberty", "Chambers"
      ]
    }
    </script>
</head>
<body>

    <nav class="glass nav-glass">
        <div style="font-weight: 800; font-size: 1.2rem; color: var(--blue);">Houston Roofing[span_3](start_span)[span_3](end_span)</div>
        <div class="nav-links" style="display: flex; gap: 20px; font-weight: 600;">
            <a href="#services">Services[span_4](start_span)[span_4](end_span)</a>
            <a href="#process">Why Us[span_5](start_span)[span_5](end_span)</a>
            <a href="#reviews">Reviews[span_6](start_span)[span_6](end_span)</a>
            <a href="#updates">Updates[span_7](start_span)[span_7](end_span)</a>
        </div>
        <div>
            <a href="tel:+18322373737" class="clay-btn" style="background: var(--blue);">(832) 237-3737[span_8](start_span)[span_8](end_span)</a>
        </div>
    </nav>

    <header class="hero">
        <div class="glass" style="padding: 60px 40px; max-width: 900px; width: 90%;">
            <span class="eyebrow">Houston roofing, done honestly[span_9](start_span)[span_9](end_span)</span>
            <h1>A roof you can trust. A process you can see.[span_10](start_span)[span_10](end_span)</h1>
            <p>Book a free inspection online, then follow every step of your project from your own dashboard.[span_11](start_span)[span_11](end_span) We inspect. We show you. You decide.[span_12](start_span)[span_12](end_span)</p>
            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                <a href="#booking" class="clay-btn" style="font-size: 1.1rem;">Book a free inspection[span_13](start_span)[span_13](end_span)</a>
                <a href="tel:+18322373737" class="clay-btn" style="background: white; color: var(--blue); border: 1px solid var(--blue);">Call (832) 237-3737[span_14](start_span)[span_14](end_span)</a>
            </div>
        </div>
    </header>

    <section id="process" style="background: var(--light-blue); max-width: 100%;">
        <div style="max-width: 1200px; margin: 0 auto;">
            <h2 style="text-align: center; margin-bottom: 40px; font-size: 2.5rem;">Our Process</h2>
            <div class="grid-2">
                <div class="clay-card">
                    <h3>1. Inspect[span_15](start_span)[span_15](end_span)</h3>
                    <p>Examine shingles, flashing, vents, penetrations and trouble spots.[span_16](start_span)[span_16](end_span)</p>
                </div>
                <div class="clay-card">
                    <h3>2. Show[span_17](start_span)[span_17](end_span)</h3>
                    <p>Share photos and plain-language notes in the customer dashboard.[span_18](start_span)[span_18](end_span)</p>
                </div>
                <div class="clay-card">
                    <h3>3. Explain[span_19](start_span)[span_19](end_span)</h3>
                    <p>Compare repair vs. replacement, cost, lifespan and insurance implications without pressure.[span_20](start_span)[span_20](end_span)</p>
                </div>
                <div class="clay-card">
                    <h3>4. Install[span_21](start_span)[span_21](end_span)</h3>
                    <p>An in-house project manager oversees the job through cleanup (VERIFY).[span_22](start_span)[span_22](end_span)</p>
                </div>
            </div>
        </div>
    </section>

    <section id="services">
        <h2 style="text-align: center; margin-bottom: 40px; font-size: 2.5rem;">Services Advertised[span_23](start_span)[span_23](end_span)</h2>
        <div class="grid-3">
            <div class="clay-card">
                <h3>Residential Asphalt & Metal[span_24](start_span)[span_24](end_span)</h3>
                <p>Good/Better/Best options: from cost-conscious asphalt shingles[span_25](start_span)[span_25](end_span) to upgraded architectural shingles[span_26](start_span)[span_26](end_span) and long-life metal panels with strong heat reflection.[span_27](start_span)[span_27](end_span)</p>
            </div>
            <div class="clay-card">
                <h3>Roof Repair & Storm/Hail[span_28](start_span)[span_28](end_span)</h3>
                <p>Fast, honest roof repair and hail or storm damage assessments in Houston.[span_29](start_span)[span_29](end_span) Leak-source tracing, photos, and an honest repair-vs-replacement recommendation.[span_30](start_span)[span_30](end_span)</p>
            </div>
            <div class="clay-card">
                <h3>Commercial & Multi-Family[span_31](start_span)[span_31](end_span)</h3>
                <p>Flat, low-slope and metal systems, coatings, repairs, replacements and new construction planned around business operations.[span_32](start_span)[span_32](end_span) Phased replacement and resident-aware scheduling.[span_33](start_span)[span_33](end_span)</p>
            </div>
        </div>
    </section>

    <section id="insurance" style="background: var(--blue); color: white; max-width: 100%;">
        <div style="max-width: 1000px; margin: 0 auto; text-align: center;">
            <h2 style="color: white; margin-bottom: 20px;">Storm Damage and Insurance Claim Guidance[span_34](start_span)[span_34](end_span)</h2>
            <p style="margin-bottom: 20px;">Provide photos and a written roof-damage report for the owner to share with their insurer; owner files/manages the claim.[span_35](start_span)[span_35](end_span)</p>
            <div style="background: rgba(255,255,255,0.1); padding: 25px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.2);">
                <p style="font-weight: 600; color: var(--orange);">Important Insurance Notice:</p>
                <p>We are roofing contractors, not public insurance adjusters.[span_36](start_span)[span_36](end_span) We do not negotiate or settle claims on your behalf.[span_37](start_span)[span_37](end_span) You are responsible for your insurance deductible.[span_38](start_span)[span_38](end_span) Texas law prohibits contractors from waiving, rebating or absorbing a deductible.[span_39](start_span)[span_39](end_span)</p>
            </div>
        </div>
    </section>

    <section id="booking">
        <div class="glass" style="max-width: 800px; margin: 0 auto; padding: 40px;">
            <h2 style="text-align: center; margin-bottom: 10px;">Book Your Appointment</h2>
            <p style="text-align: center; margin-bottom: 30px; color: #555;">Choose a service, select an open time, enter details and confirm.[span_40](start_span)[span_40](end_span)</p>
            
            <div id="alert"></div>

            <form id="bookingForm">
                <div class="grid-2" style="gap: 15px;">
                    <div class="form-group">
                        <label>Full Name *</label>
                        <input type="text" id="name" class="form-control" required placeholder="John Doe">
                    </div>
                    <div class="form-group">
                        <label>Phone Number *</label>
                        <input type="tel" id="phone" class="form-control" required placeholder="(832) 237-3737">
                    </div>
                </div>
                <div class="grid-2" style="gap: 15px;">
                    <div class="form-group">
                        <label>Email Address</label>
                        <input type="email" id="email" class="form-control" placeholder="john@example.com">
                    </div>
                    <div class="form-group">
                        <label>Service Type *</label>
                        <select id="serviceType" class="form-control" required>
                            <option value="">Select a service...</option>
                            <option value="Free roof inspection">Free roof inspection[span_41](start_span)[span_41](end_span)</option>
                            <option value="Free estimate">Free estimate[span_42](start_span)[span_42](end_span)</option>
                            <option value="Storm/hail assessment">Storm/hail assessment[span_43](start_span)[span_43](end_span)</option>
                            <option value="Repair visit">Repair visit[span_44](start_span)[span_44](end_span)</option>
                            <option value="Commercial or multi-family walkthrough">Commercial or multi-family walkthrough[span_45](start_span)[span_45](end_span)</option>
                            <option value="Phone consultation">Phone consultation[span_46](start_span)[span_46](end_span)</option>
                        </select>
                    </div>
                </div>
                <div class="grid-2" style="gap: 15px;">
                    <div class="form-group">
                        <label>Street Address *</label>
                        <input type="text" id="address" class="form-control" required placeholder="11330 West Rd[span_47](start_span)[span_47](end_span)">
                    </div>
                    <div class="form-group">
                        <label>ZIP Code *</label>
                        <input type="text" id="zip" class="form-control" required placeholder="77065[span_48](start_span)[span_48](end_span)">
                    </div>
                </div>
                <div class="grid-2" style="gap: 15px;">
                    <div class="form-group">
                        <label>Property Type *</label>
                        <select id="propertyType" class="form-control" required>
                            <option value="">Select property type...</option>
                            <option value="Single-family home">Single-family home[span_49](start_span)[span_49](end_span)</option>
                            <option value="Townhome">Townhome[span_50](start_span)[span_50](end_span)</option>
                            <option value="Commercial building">Commercial building[span_51](start_span)[span_51](end_span)</option>
                            <option value="Multi-family community">Multi-family community[span_52](start_span)[span_52](end_span)</option>
                            <option value="Other">Other[span_53](start_span)[span_53](end_span)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>How did you hear about us? (Optional)</label>
                        <select id="leadSource" class="form-control">
                            <option value="">Select source...</option>
                            <option value="Google search">Google search[span_54](start_span)[span_54](end_span)</option>
                            <option value="Google Ad">Google Ad[span_55](start_span)[span_55](end_span)</option>
                            <option value="Facebook">Facebook[span_56](start_span)[span_56](end_span)</option>
                            <option value="Instagram">Instagram[span_57](start_span)[span_57](end_span)</option>
                            <option value="Referral">Referral[span_58](start_span)[span_58](end_span)</option>
                            <option value="Radio">Radio[span_59](start_span)[span_59](end_span)</option>
                            <option value="TV">TV[span_60](start_span)[span_60](end_span)</option>
                            <option value="Direct mail">Direct mail[span_61](start_span)[span_61](end_span)</option>
                            <option value="Other">Other[span_62](start_span)[span_62](end_span)</option>
                        </select>
                    </div>
                </div>
                <div class="grid-2" style="gap: 15px;">
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
                    <label>Project Details / Notes (Optional)[span_63](start_span)[span_63](end_span)</label>
                    <textarea id="description" class="form-control" rows="3" placeholder="Briefly describe the issue..."></textarea>
                </div>
                <div class="form-group" style="display: flex; gap: 10px; align-items: start;">
                    <input type="checkbox" id="consent" required style="margin-top: 5px;">
                    <label for="consent" style="font-weight: 400; font-size: 0.85rem;">I agree that Houston Roofing & Construction may contact me about this appointment.[span_64](start_span)[span_64](end_span)</label>
                </div>
                <button type="submit" class="clay-btn" style="width: 100%; font-size: 1.1rem; padding: 15px;" id="submitBtn">Submit Booking Request</button>
            </form>
        </div>
    </section>

    <footer>
        <h2 style="color: white; margin-bottom: 15px;">Houston Roofing & Construction[span_65](start_span)[span_65](end_span)</h2>
        <p>Email: <a href="mailto:[TODO - obtain from client]">[TODO - obtain from client][span_66](start_span)[span_66](end_span)</a> | Phone: <a href="tel:+18322373737">(832) 237-3737[span_67](start_span)[span_67](end_span)</a></p>
        <p style="margin-top: 10px;">Address: 11330 West Rd, Houston, TX 77065[span_68](start_span)[span_68](end_span) | Maps link: [TODO - obtain Google Maps share link][span_69](start_span)[span_69](end_span)</p>
        <p style="margin-top: 10px; font-size: 0.9rem;">Hours: every day, 7 a.m.–8 p.m. — VERIFY[span_70](start_span)[span_70](end_span)</p>
        
        <div class="legal-notice">
            <strong>Legal & Insurance Disclosure:</strong> We are roofing contractors, not public insurance adjusters.[span_71](start_span)[span_71](end_span) We do not negotiate or settle claims on your behalf.[span_72](start_span)[span_72](end_span) You are responsible for your insurance deductible.[span_73](start_span)[span_73](end_span) Texas law prohibits contractors from waiving, rebating or absorbing a deductible.[span_74](start_span)[span_74](end_span)
        </div>

        <div style="margin-top: 30px; opacity: 0.7; font-size: 0.9rem;">
            &copy; 2026 Houston Roofing & Construction. All rights reserved.
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
                zip: document.getElementById('zip').value,
                propertyType: document.getElementById('propertyType').value,
                serviceType: document.getElementById('serviceType').value,
                leadSource: document.getElementById('leadSource').value,
                date: document.getElementById('date').value,
                time: document.getElementById('time').value,
                description: document.getElementById('description').value,
                consent: document.getElementById('consent').checked
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
                    alertBox.innerText = 'Success! We have your request and will confirm your appointment.[span_75](start_span)[span_75](end_span)';
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
