module.exports = (sequelize, DataTypes) => {
  const Course = sequelize.define('Course', {
    code: {
      type: DataTypes.STRING,
      allowNull: false
    },
    credits: {
      type: DataTypes.INTEGER
    },
    user_id: { // Changed from 'owner' to 'user_id'
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  })

  Course.associate = (models) => {
    Course.belongsTo(models.User, {
      foreignKey: 'user_id' // Updated foreignKey
    })
    Course.belongsToMany(models.Plan, {
      through: 'plan_courses',
      foreignKey: 'course_id'
    })
  }

  return Course
}
