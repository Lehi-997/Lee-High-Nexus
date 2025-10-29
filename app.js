// app.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');

// Models
const Member = require('./models/Member');
const User = require('./models/User');

// Routes
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const forgotPasswordRouter = require('./routes/forgotPassword');
const projectsRouter = require('./routes/projects');

const app = express();
const PORT = process.env.PORT || 3000;

/* ---------- MongoDB Connection ---------- */
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
  }
}
connectDB();

/* ---------- Middleware ---------- */
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'replace_this_secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      mongoOptions: { serverSelectionTimeoutMS: 5000 },
      ttl: 14 * 24 * 60 * 60, // 14 days
    }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7, sameSite: 'lax' }, // 7 days
  })
);

/* ---------- Inject user into all views ---------- */
app.use(async (req, res, next) => {
  if (req.session.userId) {
    try {
      const user = await User.findById(req.session.userId).lean();
      res.locals.currentUser = user || null;
      res.locals.currentUserName = user?.fullname || '';
    } catch (err) {
      console.error('Error fetching user for locals:', err);
      res.locals.currentUser = null;
      res.locals.currentUserName = '';
    }
  } else {
    res.locals.currentUser = null;
    res.locals.currentUserName = '';
  }
  next();
});

/* ---------- View Engine ---------- */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/* ---------- Routes ---------- */
app.use('/', authRouter);
app.use('/admin', adminRouter);
app.use('/', forgotPasswordRouter);
app.use('/projects', projectsRouter);

/* ---------- Auth Middleware ---------- */
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  const redirectTo = encodeURIComponent(req.originalUrl || '/projects');
  return res.redirect('/login?next=' + redirectTo);
}

/* ---------- Public Pages ---------- */
app.get('/', (req, res) => {
  res.render('index', { title: 'Lee High Nexus', page: 'home' });
});

app.get('/about', (req, res) => {
  res.render('about', { title: 'About Lee High Nexus', page: 'about' });
});

app.get('/contact', (req, res) => {
  res.render('contact', { title: 'Contact', page: 'contact' });
});

app.get('/join', (req, res) => {
  res.render('join', { title: 'Join Us - Lee High Nexus', page: 'join' });
});

app.post('/join', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    const newMember = new Member({ name, email, phone, message });
    await newMember.save();
    res.redirect(`/thank-you?email=${encodeURIComponent(email)}`);
  } catch (error) {
    console.error('❌ Error saving member:', error);
    res.status(500).send('Something went wrong. Please try again later.');
  }
});

app.get('/thank-you', (req, res) => {
  const email = req.query.email || '';
  res.render('thank-you', { title: 'Thank You - Lee High Nexus', page: 'thankyou', email });
});

/* ---------- Projects Page ---------- */
app.get('/projects', async (req, res) => {
  try {
    let user = null;
    if (req.session.userId) {
      user = await User.findById(req.session.userId).lean();
    }
    res.render('projects', { title: 'Projects - Lee High Nexus', page: 'projects', user });
  } catch (err) {
    console.error('❌ Error loading projects:', err);
    res.render('projects', { title: 'Projects - Lee High Nexus', page: 'projects', user: null });
  }
});

/* ---------- Protected Example ---------- */
app.get('/join-project', requireAuth, (req, res) => {
  const { type } = req.query;
  res.render('join-project', {
    title: `Join ${type} Project - Lee High Nexus`,
    projectType: type,
    page: 'join-project',
  });
});

/* ---------- Start Server ---------- */
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
