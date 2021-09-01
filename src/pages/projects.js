export default [
  {
    id: Math.random() * Date.now(),
    name: "Predicting Home Prices - Machine Learning",
    summary:
      "When designing this project, the objective was to build a machine learning algorithm from scratch. I wanted to work on prediction using various statistical models, and really focused on some of the following: Lasso Ridge, Gradient Boost, Regression with various polynomials. I also wanted to see the impact of a correct model that was binarized and data that was not handled correctly (un-binarized). The model was broken into two different sets, one training and one test. What made this project so unique? Well besides all of the various statistical modeling and using a 10-fold cross-validation, there was significant preprocessing that had to happen. I needed to do imputations, drop columns that created over-fitting, and had to standardize the data. The end results where quite spectacular, I actually did pretty well and managed to achieve an accuracy around 12% on the competition. As exciting as this project is I could write pages about it but instead check out the code on the GitHub link below!",
    images: ["./assets/MLPicture1.png", "./assets/ML Results.png"],
    tools: ["Python", "sklearn", "scipy", "matplotlib", "pandas", "numpy"],
    filter: ["python", "machine learning"]
  },
  {
    id: Math.random() * Date.now(),
    name: "Custom Timing Decorator",
    summary:
      "I created this when I was trying to really improve code time performance and reusability. I noticed that often enough I kept using some of the normal start.time() and end.time() code to check out performance. As data keeps getting larger I really needed to focus some on the computation time. I decided to create a decorator that I could through on top of my functions/methods to get an idea of the performance. Though it isn’t what we would normally call as a standard time of project, it does have a purpose. The point of putting it here is to show you that I constantly think of improving, that I pay attention to performance and Big-O problems and lastly having modules for reusability help with scale and readability. I hope you enjoy checking out the code below!",
    images: ["./assets/Decorator.PNG"],
    tools: ["Python"],
    filter: ["python"]
  },
  {
    id: Math.random() * Date.now(),
    name: "Pace Distribution by Gender – 2014 Boston Marathon",
    summary:
      "As an avid runner, I was curious about the Boston Marathon distribution. (One day I hope to make it). I wanted to create an interactive plot to highlight age and gender difference with a boxplot to show distribution. I gathered the data from the 2014 Boston Marathon, I then proceeded to do preprocessing. Besides cleaning up data, I also needed to establish groups for age and time performance. ",
    images: ["./assets/Pace Distribution By Gender.PNG"],
    tools: ["R", "Plotly"],
    filter: ["r", "data mining", "visualizations"]
  },
  {
    id: Math.random() * Date.now(),
    name: "Exploratory Analysis Tool",
    summary:
      "I worked with another talented Programmer to develop a tool that could compete with Tableau (Though not complete yet). The idea was that we wanted to build something we felt would not only more intuitive but also work with future developmental needs such as Machine Learning, Regressions, and other Data Science needs. We wanted to use Svelte / JavaScript for its reactivity. We also wanted to use Python for its integration to Django and its vast amount of libraries which would allow for Machine Learning, Regression, and other future development ideas. Celery and Redis where a by-product due to the long running tasks. We integrated this to handle some of our really long tasks, along with some other asynchronous functions. The end result was for individuals to use drag and drop to visually explore their data. We also developed tools for them to quickly interact / change / preprocess their data. We incorporated ways to handle missing data with imputations, to change data types etc. Though this is still in development check out some of the features in the pictures below! Would love to connect more to discuss this at anytime.",
    images: [
      "./assets/connectToData.PNG",
      "./assets/Ineractive D3 Map with Drag n Drop.PNG",
      "./assets/Intellicron_tools.PNG"
    ],
    tools: [
      "Svelte",
      "JavaScript",
      "D3",
      "Python",
      "SQL",
      "Django",
      "Redis",
      "Celery"
    ],
    filter: [
      "svetle",
      "javascript",
      "python",
      "d3",
      "database",
      "visualizations"
    ]
  },
  {
    id: Math.random() * Date.now(),
    name: "Income Prediction – Machine Learning ",
    summary:
      "This was a Kaggle competition to predict income of individuals based on education, gender, location, race, type of employment, position, and age. For this competition in particular it was for a classifier of different income levels, and for that reason I choose to use a KNN as my model of choice. I ran a train and test data with various nearest neighbors. I found the point to where overfitting started to occur and used the optimal test error to fit my model. Though a neural network might have been a better option this was done about a year before I felt comfortable with it. I also incorporated a bias when helping train the model to adjust overfitting. I had found that using an average perceptron with 5 epochs gave me the best results at 5 epochs which results in a 14.8% error. Check out the code below!",
    images: [
      "./assets/Income Prediction Epoch results.png",
      "./assets/Income Prediction Code Example.png"
    ],
    tools: ["Python", "Numpy", "Data Mining", "Preproessing"],
    filter: ["python", "machine learning"]
  },
  {
    id: Math.random() * Date.now(),
    name: "Accident! Analysis of New Zealand accident data with Poisson models",
    summary:
      "An understanding of road safety is critical for transportation officials and is also of interest to the general public. Two common modes of transportation are cars and motorcycles. Drivers may be interested to know whether being involved in a car accident with injuries would have a high chance of fatality. Motorcycle riders might want to know if weekends are safer for them to ride over weekdays with the commuter traffic. The purpose of this study is to analyze data on car and motorcycle accidents in New Zealand to answer the following two questions: Objective 1 - Is there a statistical difference in New Zealand reported car accidents with injuries vs accidents with fatalities by day of week or time of day? Objective 2 - Is a motorcyclist more likely to get in a reported accident on the weekday or the weekend in New Zealand? To answer these questions, I performed a simple exploratory analysis, and developed hypotheses. With the hypothesis in mind, I selected my primary model and fit multiple models to compare against. Next, I fit the residuals and made conclusions about the objectives of interest.",
    images: [
      "./assets/Poisson.png",
      "./assets/Accident Plots.png",
      "./assets/Accident Residuals.png"
    ],
    tools: ["R", "ggplot"],
    filter: ["r", "visualizations", "technical reports"]
  },
  {
    id: Math.random() * Date.now(),
    name:
      "Climate Change Contributor: Predicting Motor Vehicle Emissions with Time Series Techniques",
    summary:
      "𝐶𝑂2 emissions are known to be a key contributor to global climate change. A significant source of 𝐶𝑂2 emissions in the United States is from gas powered motor vehicles. To better understand emissions trajectory, I conducted a time series analysis of monthly motor vehicle 𝐶𝑂2 emissions in metric megatonnes from gasoline (excluding ethanol) in the United States for the time period between January 1973 and June 2013. I used four different time series techniques to gain a deeper understanding of the data and to set myself up to predict the next 24 months of emission levels. The techniques that I used were ARMA, (S)ARIMA, Holt-Winters Exponential Smoothing, and Spectral Analysis. Each method has a different approach to examining the time series, and my aim was to understand how they can be used to help with prediction analysis.",
    images: [
      "./assets/CO2 Prediction.png",
      "./assets/CO2 Example Code.png",
      "./assets/CO2 Residuals.png"
    ],
    tools: ["R", "ggplot"],
    filter: ["r", "visualizations", "technical reports"]
  },
  {
    id: Math.random() * Date.now(),
    name: "Dynamic Customer Analysis",
    summary:
      "The objective was to create a dynamic visualization that allowed the manager to see key metrics quickly. The dashboard was dynamic in the sense that when a filtered change in essence the captions and title changed to reflect the appropriate notes / individual. The data was modified and does not reflect true performance since it was proprietary information, however the key here is to see that I believe strongly in visualizations and their role in analytics. Also, I want to note that I am able to meet various business needs. This data required an intensive Extract, Transform and Load process (ETL) in order for me to capture these different metrics with accuracy. I wish I could share the file, however we can also look to see what visualizations and dashboards I can build for you!",
    images: ["./assets/Dynamic Caption.PNG"],
    tools: ["Tableau", "Data Mining"],
    filter: ["tableau", "database", "visualizations"]
  },
  {
    id: Math.random() * Date.now(),
    name: "Top 20 Customers",
    summary:
      "This project was unique in the sense that I had to create and maintain my own standing databases [Structured and Unsctructed] due to a joint operating agreement. Here I wanted to access one of the databases to give me the top 20 customers by year based on specific criteria. You can see this unique SQL code below that I used to run this report!",
    images: ["./assets/Top 20 Customers by Single Calendar Year.png"],
    tools: ["Database", "SQL"],
    filter: ["database", "sql"]
  },
  {
    id: Math.random() * Date.now(),
    name: "Digital Metrics",
    summary:
      "This was an interactive dashboard project to allow users (me) to filter / view various digital metrics quickly. Things like Bounce Rate, Click Through Rate, Viewership, etc. Imagine some of the visualizations I can build for you!",
    images: ["./assets/Bounce Rate.PNG"],
    tools: ["Tableau", "Google Analytics", "API"],
    filter: ["tableau", "visualizations"]
  },
  {
    id: Math.random() * Date.now(),
    name: "Budget Database",
    summary:
      "One problem I consistently ran into, was the ever changing budget iterations. Not only is it difficult to hold state of budget changes, but to consistenly get things mapped to their corresponding endpoints such as team performance, GL, Products etc. So, I created a database that I could use year after year to hold the state of various budget iterations and allow for proper allocations to their correspoding endpoints.",
    images: ["./assets/Budget_DB.png"],
    tools: ["Database", "SQL"],
    filter: ["database", "sql"]
  },
  {
    id: Math.random() * Date.now(),
    name: "Demographics by Region",
    summary:
      "One key component of any company is to know your customer! I wanted to build a tool to allow our company to understand where our customers are coming from so we could really deep dive into their demographics. This was a dashboard [data has been modified and does not represent actual] to allow the user to see where our customers are coming from for our digital platforms, what age groups, and how it performed. This was one dashboard in a sequence of dashboards to help tell the story. All of this had filters, and drill down ability to give the users the best tool possible! What can we build together?",
    images: ["./assets/Demographic.png"],
    tools: ["Tableau", "Data Mining", "Google Analytics", "API"],
    filter: ["tableau", "database", "visualizations"]
  },
  {
    id: Math.random() * Date.now(),
    name: "This website!",
    summary:
      "I wanted to build this website from the ground up, no cookie cutter site for me! Here you can see some of the JavaScript, CSS, and Svelte skills I have gained. I hope you are enjoying it!",
    images: ["./assets/this site.PNG"],
    tools: ["Svelte", "JavaScript"],
    filter: ["svetle", "javascript"]
  },
  {
    id: Math.random() * Date.now(),
    name:
      "Investigating the effects of race and gender on income using generalized linear models and penalized regression model",
    summary:
      "In recent years there have been many different social discussions over the impact of race, sex, education and other factors on income. These questions can be investigated with census data. In this analysis I used census data for the state of Oregon from 2013-2017 to examine four questions of interest: 1) Does race affect income, 2) how does gender affect total income, 3) does education or hours worked per  a larger impact on total income, and 4) what is the relationship between hours of work and education attainment? I hypothesized that: 1) there is no difference between the different races and the affect that they have on income, 2) there is no difference in income between males and females, 3) there is no difference in the effect of education and hours worked per week on total income, and 4) there is no relation between hours of work and years of education. The alternative to these four hypotheses is that there is a difference. To make inference on these hypotheses I used a generalized linear model and model diagnostics that included penalized regression.",
    images: [
      "./assets/Race and Gender by Industry.PNG",
      "./assets/Model Selection.PNG",
      "./assets/residuals of SCHL.PNG"
    ],
    tools: ["R", "ggplot", "data mining"],
    filter: ["r", "visualizations", "technical reports"]
  }
];
