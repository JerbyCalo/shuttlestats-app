# 🔧 ShuttleStats Troubleshooting Guide

## Common Issues and Fixes

### Dashboard Buttons Not Working

**Problem**: Quick action buttons on dashboard don't respond to clicks

**Solution**:
1. Check browser console for JavaScript errors
2. Ensure `dashboard-actions.js` is loading properly
3. Verify Firebase services are initialized
4. Try refreshing the page

**Technical Details**:
- Buttons are bound in `setupQuickActions()` function
- Initialization happens after auth services are ready
- Check `window.dataService` and `window.authService` are available

### Loading States Stuck

**Problem**: Dashboard stats show "..." and never update

**Solution**:
1. Check internet connection
2. Verify Firebase configuration in `js/firebase-config.js`
3. Check browser console for authentication errors
4. Try signing out and signing back in

### Authentication Issues

**Problem**: Can't login or keeps redirecting to login page

**Solution**:
1. Clear browser localStorage: Open DevTools > Application > Storage > Clear All
2. Check Firebase Auth configuration
3. Verify email/password format
4. Try Google Sign-in as alternative

### Performance Issues

**Problem**: App is slow or unresponsive

**Solution**:
1. Clear browser cache and cookies
2. Check network connection
3. Disable browser extensions temporarily
4. Try in incognito/private browsing mode

## Development Tips

### Testing Changes Locally
```bash
# Start local server
npx http-server . -p 3000 -o

# Or use any other static server
python -m http.server 3000  # Python 3
```

### Debugging Steps
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Verify localStorage data in Application tab

### Code Organization
- Authentication: `js/auth-service.js` (primary) 
- UI Components: `js/common-ui.js`
- Dashboard Logic: `dashboard.html` (inline scripts)
- Quick Actions: `js/dashboard-actions.js`

### Common Git Commands for Fixes
```bash
# Quick commit for small fixes
git add -A
git commit -m "fix dashboard button issue"
git push

# Check what changed
git status
git diff

# Reset if needed
git reset --hard HEAD~1  # Undo last commit (careful!)
```

## When to Get Help

Contact support if:
- Issues persist after trying these solutions
- Browser console shows persistent errors
- Data is missing or corrupted
- Authentication completely fails

Remember: Most issues are solved by:
1. Refreshing the page
2. Clearing browser storage  
3. Checking internet connection
4. Looking at browser console errors
