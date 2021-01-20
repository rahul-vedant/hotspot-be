'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CustomerFavLocation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      CustomerFavLocation.belongsTo(models.Customer);
    }
  };
  CustomerFavLocation.init({
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    default_address: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
  }, {
      sequelize,
    underscored:true,
    tableName: 'customer_fav_locations',
    modelName: 'CustomerFavLocation',
  });
  return CustomerFavLocation;
};