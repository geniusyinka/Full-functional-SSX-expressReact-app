const getSSXConfig = async () => {

  return { 
        enableDaoLogin: !!(process.env.REACT_APP_SSX_DAO_LOGIN === "true"),
        // ADD THIS LINE
        providers: { server: { host: process.env.REACT_APP_SSX_METRICS_SERVER ?? "" } },
  };
};

export default getSSXConfig;