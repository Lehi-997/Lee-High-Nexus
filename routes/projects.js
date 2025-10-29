const express = require('express');
const router = express.Router();

// Main projects page
router.get('/', (req, res) => {
  res.render('projects', {
    title: 'Our Projects',
    page: 'projects',
    currentUser: res.locals.currentUser,       // ✅ Use res.locals
    currentUserName: res.locals.currentUserName
  });
});

// Arts page
router.get('/arts', (req, res) => {
  res.render('projects/arts', {
    title: 'Arts - Lee High Nexus',
    page: 'projects',
    currentUser: res.locals.currentUser,
    currentUserName: res.locals.currentUserName
  });
});

// Academics page
router.get('/academics', (req, res) => {
  res.render('projects/academics', {
    title: 'Academics - Lee High Nexus',
    page: 'projects',
    currentUser: res.locals.currentUser,
    currentUserName: res.locals.currentUserName
  });
});

// Burudani & Events page
router.get('/burudani', (req, res) => {
  res.render('projects/burudani', {
    title: 'Burudani & Events - Lee High Nexus',
    page: 'projects',
    currentUser: res.locals.currentUser,
    currentUserName: res.locals.currentUserName
  });
});

module.exports = router;
