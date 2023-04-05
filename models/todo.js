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
      // define association here
    }

    static getTodos() {
      return this.findAll();
    }

    static addTodo({ title, dueDate }) {
      return this.create({ title: title, dueDate: dueDate, completed: false });
    }

    static completed() {
      const complete =this.findAll({
        where:{
          completed:true,
        }
      });
      return complete;
    }
    
      markAsCompleted() {
      return this.update(
        { completed: true}
      );
    };

    setCompletionStatus(tf) {
      return this.update(
        { completed: tf}
      );
    };
      
    

    static deleteTodo(id) {
      return this.destroy({
        where: {
          id,
        }
      });
  }
}
  TODO.init(
    {
      title: DataTypes.STRING,
      dueDate: DataTypes.DATEONLY,
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "TODO",
    }
  );
  return TODO;
};
