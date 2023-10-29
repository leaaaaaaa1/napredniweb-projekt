// pages/login.tsx

import { NextPage, GetServerSideProps } from 'next';

const LoginPage: NextPage = () => {
  return <div>Redirecting to login...</div>;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  context.res.writeHead(302, { Location: '/api/auth/login' });
  context.res.end();
  return { props: {} };
};

export default LoginPage;
