module.exports = (sequelize, DataTypes) => {
    const Course = sequelize.define('Course', {
      code: {
        type: DataTypes.STRING,
        allowNull: false
      },
      credits: {
        type: DataTypes.INTEGER
      },
      owner: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        }
      }
    });
  
    Course.associate = (models) => {
      Course.belongsTo(models.User, {
        foreignKey: 'userId'
      }),
    Course.belongsToMany(models.Plan, {
        through: 'plan_courses',
        foreignKey: 'course_id'
      });
    };
  
    return Course;
  };
  