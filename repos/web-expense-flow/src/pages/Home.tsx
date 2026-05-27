import { Layout } from 'framework-react-core';

export interface Navbar {
  label: string;
  path: string;
}

function Home() {
  const menuOption: Navbar[] = [];

  return (
    <Layout menuOptions={menuOption}>
      <div>Home</div>
    </Layout>
  );
}

export default Home;
