const express = require('express');
const app = express();

console.log('Testing routes import...');

try {
    const chatRoomRoutes = require('./routes/chatRooms');
    console.log(' SUCCESS: Routes imported correctly');
    console.log(' Type:', typeof chatRoomRoutes);
    
    if (typeof chatRoomRoutes === 'function') {
        console.log(' PERFECT! It is a router function (this is correct)');
        console.log(' Your server should work now!');
    } else {
        console.log(' PROBLEM: It is NOT a function');
        console.log(' What it actually is:', chatRoomRoutes);
        console.log('This means your file has model code instead of route code');
    }
} catch (error) {
    console.log('ERROR importing routes:', error.message);
}
