const HomePage = () => {
    return (
      <div className="container d-flex flex-column align-items-center justify-content-center vh-100">
        <div className="card shadow-lg p-4 text-center">
          <h1 className="mb-3 text-primary">Welcome to Bootstrap + React!</h1>
          <p className="text-muted">
            This is a simple example page using Bootstrap 5.
          </p>
          <div className="mt-3">
            <button className="btn btn-primary me-2">Get Started</button>
            <button className="btn btn-outline-secondary">Learn More</button>
          </div>
        </div>
      </div>
    );  
  };
  
  export default HomePage;
  