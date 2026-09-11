const Student = require('../models/Student');
const User = require('../models/User');

/**
 * Fetch a class-wise leaderboard (sorted top to bottom by total marks).
 * Uses MongoDB Aggregation Framework to calculate total marks and assign ranks.
 */
const getClassLeaderboard = async (req, res) => {
  try {
    const { standard, section } = req.query;
    
    if (!standard || !section) {
      return res.status(400).json({ error: 'Standard and section are required parameters' });
    }

    const matchStage = {};
    if (standard !== 'All') matchStage.standard = standard;
    if (section !== 'All') matchStage.section = section;

    const leaderboard = await Student.aggregate([
      ...buildStudentAggregationPipeline(matchStage),
      // We will let the frontend rank by marks or percentage as it already does,
      // but if we want rank by percentage here by default:
      {
        $sort: {
          percentage: -1,
          totalMarks: -1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: leaderboard
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const buildStudentAggregationPipeline = (matchQuery) => {
  return [
    { $match: matchQuery },
    { $unwind: { path: "$terms", preserveNullAndEmptyArrays: false } },
    {
      $group: {
        _id: {
          studentId: "$_id",
          standard: "$standard",
          section: "$section",
          name: "$name",
          gender: "$gender",
          emisNumber: "$emisNumber",
          termName: "$terms.termName"
        },
        termMarks: { $first: "$terms.marks" }
      }
    },
    { $unwind: { path: "$termMarks", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: {
          studentId: "$_id.studentId",
          standard: "$_id.standard",
          section: "$_id.section",
          name: "$_id.name",
          gender: "$_id.gender",
          emisNumber: "$_id.emisNumber",
          termName: "$_id.termName",
          subject: "$termMarks.subject"
        },
        score: { $first: { $convert: { input: "$termMarks.score", to: "double", onError: 0, onNull: 0 } } }
      }
    },
    {
      $group: {
        _id: {
          studentId: "$_id.studentId",
          standard: "$_id.standard",
          section: "$_id.section",
          name: "$_id.name",
          gender: "$_id.gender",
          emisNumber: "$_id.emisNumber",
          termName: "$_id.termName"
        },
        termScore: { $sum: "$score" }
      }
    },
    {
      $lookup: {
        from: "classconfigs",
        let: { std: "$_id.standard", sec: "$_id.section" },
        pipeline: [
          { $match: { $expr: { $and: [ { $eq: ["$standard", "$$std"] }, { $eq: ["$section", "$$sec"] } ] } } }
        ],
        as: "classConfig"
      }
    },
    {
      $addFields: {
        expectedSubjects: {
          $cond: {
            if: { $gt: [{ $size: "$classConfig" }, 0] },
            then: { $size: { $arrayElemAt: ["$classConfig.subjects", 0] } },
            else: {
              $cond: {
                if: { $in: ["$_id.standard", ["11", "12"]] }, then: 6, else: 5
              }
            }
          }
        }
      }
    },
    {
      $addFields: {
        termMaxMarks: { $multiply: ["$expectedSubjects", 100] }
      }
    },
    {
      $group: {
        _id: "$_id.studentId",
        emisNumber: { $first: "$_id.emisNumber" },
        name: { $first: "$_id.name" },
        standard: { $first: "$_id.standard" },
        section: { $first: "$_id.section" },
        gender: { $first: "$_id.gender" },
        totalMarks: { $sum: "$termScore" },
        maximumMarks: { $sum: "$termMaxMarks" },
        photoUrl: { $first: "$_id.photoUrl" },
        processedTerms: {
          $push: {
            termName: "$_id.termName",
            termScore: "$termScore",
            termMaxMarks: "$termMaxMarks"
          }
        }
      }
    },
    { $match: { maximumMarks: { $gt: 0 } } },
    {
      $addFields: {
        percentage: {
          $round: [
            { $multiply: [ { $divide: ["$totalMarks", "$maximumMarks"] }, 100 ] },
            2
          ]
        },
        genderPriority: {
          $switch: {
            branches: [
              { case: { $eq: ["$gender", "Male"] }, then: 1 },
              { case: { $eq: ["$gender", "Female"] }, then: 2 }
            ],
            default: 3
          }
        }
      }
    }
  ];
};

const getDashboardStats = async (req, res) => {
  try {
    let query = {};
    if (req.dbUser && req.dbUser.role === 'teacher') {
      if (req.dbUser.assignedClasses && req.dbUser.assignedClasses.length > 0) {
        query = {
          $or: req.dbUser.assignedClasses.map(c => ({
            standard: c.standard,
            section: c.section
          }))
        };
      } else {
        // If teacher has no classes assigned, they have 0 students
        query = { _id: null };
      }
    }

    const totalStudents = await Student.countDocuments(query);
    const maleStudents = await Student.countDocuments({ ...query, gender: 'Male' });
    const femaleStudents = await Student.countDocuments({ ...query, gender: 'Female' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });

    // Get Top 3 students across the school (or teacher's classes)
    const topStudents = await Student.aggregate([
      ...buildStudentAggregationPipeline({ ...query, standard: { $in: ["6", "7", "8", "9", "10", "11", "12"] } }),
      { $sort: { percentage: -1, totalMarks: -1, genderPriority: 1, name: 1 } },
      { $limit: 3 }
    ]);

    const top12Students = await Student.aggregate([
      ...buildStudentAggregationPipeline({ ...query, standard: '12' }),
      { $sort: { percentage: -1, totalMarks: -1, genderPriority: 1, name: 1 } },
      { $limit: 3 }
    ]);

    const top10Students = await Student.aggregate([
      ...buildStudentAggregationPipeline({ ...query, standard: '10' }),
      { $sort: { percentage: -1, totalMarks: -1, genderPriority: 1, name: 1 } },
      { $limit: 3 }
    ]);

    // Students Abstract Pipeline (Total, Male, Female by class/section)
    const studentsAbstract = await Student.aggregate([
      { $match: query },
      {
        $group: {
          _id: { standard: "$standard", section: "$section" },
          totalStudents: { $sum: 1 },
          maleStudents: { $sum: { $cond: [{ $eq: ["$gender", "Male"] }, 1, 0] } },
          femaleStudents: { $sum: { $cond: [{ $eq: ["$gender", "Female"] }, 1, 0] } }
        }
      },
      {
        $addFields: {
          standardOrder: {
            $convert: { input: "$_id.standard", to: "int", onError: 999, onNull: 999 }
          }
        }
      },
      { $sort: { standardOrder: 1, "_id.section": 1 } },
      { $project: { standardOrder: 0 } }
    ]);

    // Classwise First Mark Pipeline (Highest total score by term, per class/section)
    const classwiseFirstMarks = await Student.aggregate([
      ...buildStudentAggregationPipeline(query),
      { $unwind: "$processedTerms" },
      {
        $addFields: {
          "processedTerms.percentage": {
            $round: [
              { $multiply: [ { $divide: ["$processedTerms.termScore", "$processedTerms.termMaxMarks"] }, 100 ] },
              2
            ]
          }
        }
      },
      {
        $sort: { "processedTerms.percentage": -1, "processedTerms.termScore": -1 }
      },
      {
        $group: {
          _id: {
            standard: "$standard",
            section: "$section",
            termName: "$processedTerms.termName"
          },
          studentId: { $first: "$_id" },
          topStudent: { $first: "$name" },
          topScore: { $first: "$processedTerms.termScore" },
          maximumMarks: { $first: "$processedTerms.termMaxMarks" },
          percentage: { $first: "$processedTerms.percentage" }
        }
      },
      { $sort: { "_id.standard": 1, "_id.section": 1, "_id.termName": 1 } }
    ]);

    // All Exams First Marks Pipeline (Highest overall score across all exams, per class/section)
    const allExamsFirstMarks = await Student.aggregate([
      ...buildStudentAggregationPipeline(query),
      { $sort: { percentage: -1, totalMarks: -1, name: 1 } },
      {
        $group: {
          _id: {
            standard: "$standard",
            section: "$section"
          },
          studentId: { $first: "$_id" },
          topStudent: { $first: "$name" },
          topScore: { $first: "$totalMarks" },
          maximumMarks: { $first: "$maximumMarks" },
          percentage: { $first: "$percentage" }
        }
      },
      { $sort: { "_id.standard": 1, "_id.section": 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        maleStudents,
        femaleStudents,
        totalTeachers,
        topStudents,
        top12Students,
        top10Students,
        studentsAbstract,
        classwiseFirstMarks,
        allExamsFirstMarks
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getClassLeaderboard,
  getDashboardStats
};
