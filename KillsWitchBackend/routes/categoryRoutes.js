var express = require('express');
const { category } = require('../models');
const router = express.Router();


router.post('/', async(req, res)=>{
    try{
        const categories = await category.create(req.body);
        res.status(201).json(categories);
    }
    catch(err){
        res.status(500).json({message: err.message});}});

router.get('/', async(req, res)=>{
    try{
        const categories = await category.findAll()
        res.status(200).json(categories);

    }catch(err){
        res.status(500).json({message: err.message}) }});

module.exports = router;


