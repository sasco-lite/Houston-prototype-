const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cookieParser());

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

// Reuse or Re-init Schema
const bookingSchema = new mongoose.Schema({
    name: String, phone: String, email: String, address: String, serviceType: String,
    date: String, time: String, description: String, status: String
}, { timestamps: true });
const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

// --- Auth Middleware ---
const requireAuth = (req, res, next) => {
    const token = req.cookies.admin_token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        jwt.verify(token, process.env.ADMIN_PASSWORD || 'secret');
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid session' });
    }
};

// --- HTML Templates ---
const generateLoginHTML = () => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"><title>Admin Login</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
    <style>
        body { background: #1C3144; font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .login-box { background: rgba(255,255,255,0.9); padding: 40px; border-radius: 20px; width: 100%; max-width: 400px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        h2 { text-align: center; color: #1C3144; margin-bottom: 20px; }
        input { width: 100%; padding: 12px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 8px; box-sizing: border-box; }
        button { width: 100%; background: #F05D23; color: white; padding: 12px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
        #error { color: red; text-align: center; margin-bottom: 10px; display: none; }
    </style>
</head>
<body>
    <div class="login-box">
        <h2>Secure Portal</h2>
        <div id="error">Invalid credentials</div>
        <form id="loginForm">
            <input type="text" id="username" placeholder="Username" required>
            <input type="password" id="password" placeholder="Password" required>
            <button type="submit">Login</button>
        </form>
    </div>
    <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const res = await fetch('/admin/login', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ u: document.getElementById('username').value, p: document.getElementById('password').value })
            });
            if (res.ok) window.location.reload();
            else document.getElementById('error').style.display = 'block';
        });
    </script>
</body>
</html>
`;

const generateDashboardHTML = () => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"><title>Admin Dashboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        :root { --bg: #FDFBF7; --text: #2D3142; --orange: #F05D23; --blue: #1C3144; }
        body { margin: 0; font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); }
        header { background: var(--blue); color: white; padding: 15px 30px; display: flex; justify-content: space-between; align-items: center; }
        header button { background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px 15px; border-radius: 6px; cursor: pointer; }
        .container { padding: 30px; max-width: 1400px; margin: 0 auto; }
        
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-left: 5px solid var(--orange); }
        .stat-card h3 { margin: 0 0 10px 0; font-size: 0.9rem; color: #666; }
        .stat-card .value { font-size: 2rem; font-weight: 800; color: var(--blue); }

        table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        th, td { padding: 15px; text-align: left; border-bottom: 1px solid #eee; font-size: 0.9rem; }
        th { background: #f8f9fa; font-weight: 600; color: var(--blue); }
        .status-select { padding: 6px; border-radius: 6px; border: 1px solid #ccc; font-weight: 600; }
        .action-btn { padding: 6px 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: 600; margin-right: 5px; }
        .btn-del { background: #fee2e2; color: #991b1b; }
        .btn-wa { background: #dcfce7; color: #166534; text-decoration: none; display: inline-block; }
    </style>
</head>
<body>
    <header>
        <h2>Apex Admin</h2>
        <button onclick="logout()">Logout</button>
    </header>
    <div class="container">
        <div class="stats">
            <div class="stat-card"><h3>Total Bookings</h3><div class="value" id="statTotal">0</div></div>
            <div class="stat-card"><h3>Pending</h3><div class="value" id="statPending">0</div></div>
            <div class="stat-card"><h3>Completed</h3><div class="value" id="statCompleted">0</div></div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Date/Time</th>
                    <th>Customer Info</th>
                    <th>Address</th>
                    <th>Service / Details</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="tableBody"><tr><td colspan="6" style="text-align:center;">Loading...</td></tr></tbody>
        </table>
    </div>

    <script>
        async function fetchBookings() {
            const res = await fetch('/admin/api/bookings');
            if (!res.ok) { if(res.status === 401) window.location.reload(); return; }
            const data = await res.json();
            
            document.getElementById('statTotal').innerText = data.length;
            document.getElementById('statPending').innerText = data.filter(b => b.status === 'Pending').length;
            document.getElementById('statCompleted').innerText = data.filter(b => b.status === 'Completed').length;

            const tbody = document.getElementById('tableBody');
            tbody.innerHTML = '';
            
            data.forEach(b => {
                const tr = document.createElement('tr');
                tr.innerHTML = \`
                    <td><strong>\${b.date}</strong><br>\${b.time}</td>
                    <td><strong>\${b.name}</strong><br>\${b.phone}<br>\${b.email || ''}</td>
                    <td>\${b.address}</td>
                    <td><strong>\${b.serviceType}</strong><br><small>\${b.description || 'No description'}</small></td>
                    <td>
                        <select class="status-select" onchange="updateStatus('\${b._id}', this.value)">
                            <option value="Pending" \${b.status === 'Pending' ? 'selected' : ''}>Pending</option>
                            <option value="Confirmed" \${b.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                            <option value="In Progress" \${b.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                            <option value="Completed" \${b.status === 'Completed' ? 'selected' : ''}>Completed</option>
                            <option value="Cancelled" \${b.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </td>
                    <td>
                        <a href="https://wa.me/\${b.phone.replace(/\\D/g, '')}" target="_blank" class="action-btn btn-wa">WhatsApp</a>
                        <button onclick="deleteBooking('\${b._id}')" class="action-btn btn-del">Delete</button>
                    </td>
                \`;
                tbody.appendChild(tr);
            });
        }

        async function updateStatus(id, newStatus) {
            await fetch(\`/admin/api/bookings/\${id}\`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            fetchBookings();
        }

        async function deleteBooking(id) {
            if(!confirm('Are you sure you want to delete this booking?')) return;
            await fetch(\`/admin/api/bookings/\${id}\`, { method: 'DELETE' });
            fetchBookings();
        }

        async function logout() {
            await fetch('/admin/logout', { method: 'POST' });
            window.location.reload();
        }

        fetchBookings();
    </script>
</body>
</html>
`;

// --- Routes ---

// Serve UI based on Auth State
app.get('/admin', (req, res) => {
    const token = req.cookies.admin_token;
    if (!token) return res.send(generateLoginHTML());
    try {
        jwt.verify(token, process.env.ADMIN_PASSWORD || 'secret');
        res.send(generateDashboardHTML());
    } catch {
        res.send(generateLoginHTML());
    }
});

// Authentication API
app.post('/admin/login', (req, res) => {
    const { u, p } = req.body;
    if (u === process.env.ADMIN_USERNAME && p === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign({ role: 'admin' }, process.env.ADMIN_PASSWORD || 'secret', { expiresIn: '8h' });
        res.cookie('admin_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 8 * 3600000 });
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.post('/admin/logout', (req, res) => {
    res.clearCookie('admin_token');
    res.json({ success: true });
});

// Protected Data APIs
app.get('/admin/api/bookings', requireAuth, async (req, res) => {
    await connectDB();
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
});

app.put('/admin/api/bookings/:id', requireAuth, async (req, res) => {
    await connectDB();
    await Booking.findByIdAndUpdate(req.params.id, { status: req.body.status });
    res.json({ success: true });
});

app.delete('/admin/api/bookings/:id', requireAuth, async (req, res) => {
    await connectDB();
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

module.exports = app;
