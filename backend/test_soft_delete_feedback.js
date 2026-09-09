const mongoose = require('mongoose');
const StudentFeedback = require('./models/StudentFeedback');
require('dotenv').config();

async function runTest() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edupulse');
    console.log('Connected to MongoDB');

    // 1. Create a fake student feedback directly
    const fakeStudentId = new mongoose.Types.ObjectId();
    const feedback = new StudentFeedback({
      studentId: fakeStudentId,
      type: 'text',
      message: 'Test soft delete message',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    
    await feedback.save();
    console.log('1. Created feedback with ID:', feedback._id);

    // 2. Fetch using the same logic as GET endpoint
    const fetchedBeforeDelete = await StudentFeedback.find({
      expiresAt: { $gt: new Date() },
      isDeleted: { $ne: true }
    });
    
    const found = fetchedBeforeDelete.some(f => f._id.equals(feedback._id));
    console.log(`2. Appears in GET query (isDeleted != true)? ${found}`);

    // 3. Simulate DELETE API logic (soft delete)
    const adminUserId = new mongoose.Types.ObjectId();
    const deletedFeedback = await StudentFeedback.findByIdAndUpdate(
      feedback._id,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: adminUserId
        }
      },
      { new: true }
    );
    console.log('3. Soft deleted feedback via API logic.');

    // 4. Verify it's no longer in GET query
    const fetchedAfterDelete = await StudentFeedback.find({
      expiresAt: { $gt: new Date() },
      isDeleted: { $ne: true }
    });
    const foundAfter = fetchedAfterDelete.some(f => f._id.equals(feedback._id));
    console.log(`4. Appears in GET query after soft delete? ${foundAfter}`);

    // 5. Verify it still exists in the database
    const dbCheck = await StudentFeedback.findById(feedback._id);
    console.log(`5. Still exists in MongoDB? ${dbCheck !== null}`);
    console.log(`   isDeleted: ${dbCheck.isDeleted}`);
    console.log(`   deletedAt populated: ${dbCheck.deletedAt !== null}`);
    console.log(`   deletedBy populated: ${dbCheck.deletedBy !== null}`);

    // Clean up
    await StudentFeedback.deleteOne({ _id: feedback._id });
    console.log('Cleaned up test data.');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

runTest();
