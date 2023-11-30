module.exports = (sequelize, DataTypes) => {
  const Plan = sequelize.define('Plan', {
    malla: {
      type: DataTypes.TEXT
    },
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING
    }
  })

  Plan.associate = (models) => {
    Plan.belongsTo(models.User, {
      foreignKey: 'user_id'
    })
    Plan.belongsToMany(models.Course, {
      through: 'plan_courses',
      foreignKey: 'plan_id'
    })
  }

  return Plan
}
