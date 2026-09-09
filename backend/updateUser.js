const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  await User.updateOne({ email: 'blackpanther272007@gmail.com' }, { $set: { role: 'teacher', status: 'pending' } });
  console.log('User updated!');
  process.exit(0);
});
