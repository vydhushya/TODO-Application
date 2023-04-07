"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class TODO extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      TODO.belongsTo(models.User, {
        foreignKey: "userId",
      });
      // define association here
    }

    static getTodos() {
      return this.findAll();
    }

    static addTodo({ title, dueDate, userId }) {
      return this.create({
        title: title,
        dueDate: dueDate,
        completed: false,
        userId,
      });
    }

    static completed(userId) {
      const complete = this.findAll({
        where: {
          completed: true,
          userId,
        },
      });
      return complete;
    }

    markAsCompleted(userId) {
      return this.update({ completed: true, userId });
    }

    setCompletionStatus(tf) {
      return this.update({ completed: tf });
    }

    static deleteTodo(id, userId) {
      return this.destroy({
        where: {
          id,
          userId,
        },
      });
    }
  }
  TODO.init(
    {
      title: {
        type:DataTypes.STRING,
        allowNull: false,
        validate:{
          notNull:true,
        },
      },
      dueDate: {
        type: DataTypes.DATEONLY,
        allowNull:false,
        validate:{
          notNull:true,
        }
      },
      completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "TODO",
    }
  );
  return TODO;
};
