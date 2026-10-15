export const routePaths = {
  home: '/',
  workflows: '/workflows',
  workflowDetail: '/workflows/:id',
  workflowBuilder: '/workflows/builder',
  missions: '/missions',
  missionDetail: '/missions/:id',
  dispatch: '/dispatch',
  dispatchPreview: '/dispatch/preview',
  mapDemo: '/map-demo',
  robotMapping: '/robot-mapping',
  robots: '/robots',
  maps: '/maps',
  reports: '/reports',
  notifications: '/notifications',
  admin: '/admin',
  notFound: '*'
} as const;
