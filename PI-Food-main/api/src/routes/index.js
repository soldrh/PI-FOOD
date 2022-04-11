const { Router } = require('express');
const { default: axios } = require("axios");
// Importar todos los routers;
// Ejemplo: const authRouter = require('./auth.js');
const { Recipe, TipoDieta} = require("../db.js");
const { YOUR_API_KEY } = process.env;

const formatApiSteps =(el) => {
  if(el.analyzedInstructions[0]){
    let formatSteps = el.analizedInstructions[0].steps.reduce((a,b)=> {
      let newStep=b.step;
      return a + "|" + newStep;
    }, "");
    formatSteps= formatSteps.split("|");
    formatSeps.shift();
    return formatSteps;
  } else return "No steps";
};
const getApiRecipes = async () => {
  let apiRecipes = await axios.get(
    `https://api.spoonacular.com/recipes/complexSearch?apiKey=${YOUR_API_KEY}&addRecipeInformaion=true&number=100`
  );
  let formatRecipes =apiRecipes.data.results.map((el)=>{
    if(el.vegetarian && !el.diet.includes("vegerarian")){
      el.TipoDieta.push("vegetarian");
    }
    return {
      name: el.name,
      id: el.id,
      summary: el.summary,
      healtScore: el.healtScore,
      score: el.score,
      image: el.image,
      steps: formatApiSteps(el),
      tipoDieta: el.TipoDieta,
    };
  });
  return formatRecipes
};
const getDbRecipes = async ()=>{
  let dbRecipes = await Recipe.findAll({ include: TipoDieta});
  dbRecipes = JSON.stringify(dbRecipes);
  dbRecipes = JSON.parse(dbRecipes);
  dbRecipes = dbRecipes.map((recipe) =>{ 
  if(recipe.steps){
    recipe.steps = recipe.steps.split("|");
    recipe.steps.shift();
  }
  recipe.tipoDieta = recipe.tipoDieta.map((tipoDieta)=> tipoDieta.name);
  return {
    ...recipe,
    };
  });
return dbRecipes;
};
const getAllRecipes = async () =>{
  const apiRecipes = await getApiRecipes();
  const dbRecipes = await getDbRecipes();
  let allRecipes = dbRecipes.concat(apiRecipes);
  allRecipes = allRecipes.sort((a,b)=>{
    if(a.name.toLowerCase()>b.name.toLowerCase()){
      return 1;
    }
    if(b.name.toLowerCase()>a.name.toLowerCase()){
      return -1;
  }
  return 0;
});
return allRecipes;
}
const router = Router();
router.get("/types", async (req, res) => {
  let dbTipoDieta = await tipoDieta.findAll();
  if(!tipoDieta.length){
    let tipoDieta = ["vegetarian"];
    const apiRecipes =await getApiRecipes();
    apiRecipes.forEach((el)=>{
      el.tipoDieta.forEach((tipoDieta) =>{
        if(tipoDieta && !tipoDieta.includes(diet)){
          tipoDieta.push(diet);
                  }
      });
    });
    let formattedtipoDieta = tipoDieta.map((diet)=>{
      return {
        name: diet,
      };
    });
    try {
      let dietCreated = await tipoDieta.bulk.Create(formattedtipoDieta);
      res.json(dietsCreated);
      } catch (error){
        res.send(error);
        }
  }else {
res.json(dbTipoDieta);
  }
 });

 router.post("/recipe", async (req, res) =>{
   const { name, summary, healtScore, score, image, steps,tipoDieta} = req.body;
   try {
     let recipe = await Recipe.create({
       name,
       summary,
       healtScore,
       score,
       image,
       steps,
       });
       const dietsToBeAdded = await tipoDieta.findAll({
         where: {
           name: tipoDieta,
         },
       });
       await recipe.addTipoDieta(dietsToBeAdded);
       res.json(recipe);
       }catch (error){
         res.send(error);
       }
 });

 router.get("/recipes/", async (req, res)=>{
   try {
     const allRecipes= await getAllRecipes();
     if (Object.keys(req.query).length !== 0){
       const queryRecipe = allRecipes.find(
         (recipe) => recipe.name === req.query.name
         );
         if(queryRecipe){
           res.json(queryRecipe);
         }else{
           res.status(404).json("Recipe not found");
         }
     }else{
       res.json(allRecipes);
     }
     } catch (error){
       res.send(error);
     }
 });
 router.get("/recipes/:id", async (req, res)=> {
   try {
     const allRecipes = await getAllRecipes();
     let id = req.params.id;
     const paramRecipe = allRecipes.find((recipe) => recipe.id === id);
     if(!paramRecipe){
       res.status(404).json("Recipe not found");
     } else {
       res.status(200).json(paramRecipe);
     }
   }catch (error){
     res.status(404).send("Recipe not found");
   }
 });


module.exports = router;
