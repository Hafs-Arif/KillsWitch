

module.exports = (sequelize, DataTypes)=>{
    const passwordReset= sequelize.define('passwordReset', {
        email:{
            type: DataTypes.STRING,
            allowNull: false
        },
        otp:{
            type: DataTypes.STRING,
            allowNull: false
        },
        expireAt:{
            type: DataTypes.DATE,
            allowNull: false
        }
    })
    return passwordReset;

};