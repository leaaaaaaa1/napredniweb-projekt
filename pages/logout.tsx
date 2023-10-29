// pages/logout.tsx

import { NextPage, GetServerSideProps } from 'next';

const LogoutPage: NextPage = () => {
  return <div>Prebacivanje na login...</div>;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  context.res.writeHead(302, { Location: '/api/auth/logout' });
  context.res.end();
  return { props: {} };
};

export default LogoutPage;
