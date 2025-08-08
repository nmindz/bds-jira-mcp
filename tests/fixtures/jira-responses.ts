/**
 * JIRA API Response Fixtures
 * Mock data for testing JIRA service methods
 */

export const mockJiraTicket = {
  expand: "renderedFields,names,schema,operations,editmeta,changelog,versionedRepresentations",
  id: "10001",
  self: "https://test-company.atlassian.net/rest/api/2/issue/10001",
  key: "TEST-123",
  fields: {
    summary: "Fix user authentication bug",
    description: "Users are unable to log in using SSO credentials. The error occurs consistently across all browsers.",
    status: {
      self: "https://test-company.atlassian.net/rest/api/2/status/1",
      description: "The issue is open and ready for the assignee to start work on it.",
      iconUrl: "https://test-company.atlassian.net/images/icons/statuses/open.png",
      name: "To Do",
      id: "1",
      statusCategory: {
        self: "https://test-company.atlassian.net/rest/api/2/statuscategory/2",
        id: 2,
        key: "new",
        colorName: "blue-gray",
        name: "To Do"
      }
    },
    issuetype: {
      self: "https://test-company.atlassian.net/rest/api/2/issuetype/10001",
      id: "10001",
      description: "A task that needs to be done.",
      iconUrl: "https://test-company.atlassian.net/secure/viewavatar?size=xsmall&avatarId=10318&avatarType=issuetype",
      name: "Task",
      subtask: false,
      avatarId: 10318
    },
    project: {
      self: "https://test-company.atlassian.net/rest/api/2/project/10000",
      id: "10000",
      key: "TEST",
      name: "Test Project",
      projectTypeKey: "software",
      avatarUrls: {
        "48x48": "https://test-company.atlassian.net/secure/projectavatar?avatarId=10324",
        "24x24": "https://test-company.atlassian.net/secure/projectavatar?size=small&avatarId=10324",
        "16x16": "https://test-company.atlassian.net/secure/projectavatar?size=xsmall&avatarId=10324",
        "32x32": "https://test-company.atlassian.net/secure/projectavatar?size=medium&avatarId=10324"
      }
    },
    assignee: {
      self: "https://test-company.atlassian.net/rest/api/2/user?accountId=557058:f58131cb-b67d-43c7-b30d-6b58d40bd077",
      accountId: "557058:f58131cb-b67d-43c7-b30d-6b58d40bd077",
      emailAddress: "john.doe@example.com",
      avatarUrls: {
        "48x48": "https://secure.gravatar.com/avatar/user.png?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FJD-5.png",
        "24x24": "https://secure.gravatar.com/avatar/user.png?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FJD-2.png",
        "16x16": "https://secure.gravatar.com/avatar/user.png?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FJD-1.png",
        "32x32": "https://secure.gravatar.com/avatar/user.png?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FJD-3.png"
      },
      displayName: "John Doe",
      active: true,
      timeZone: "America/New_York"
    },
    priority: {
      self: "https://test-company.atlassian.net/rest/api/2/priority/3",
      iconUrl: "https://test-company.atlassian.net/images/icons/priorities/medium.svg",
      name: "Medium",
      id: "3"
    },
    created: "2024-01-15T10:30:00.000+0000",
    updated: "2024-01-15T14:45:00.000+0000",
    reporter: {
      self: "https://test-company.atlassian.net/rest/api/2/user?accountId=557058:a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      accountId: "557058:a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      emailAddress: "jane.smith@example.com",
      displayName: "Jane Smith",
      active: true
    }
  }
};

export const mockEpicTicket = {
  ...mockJiraTicket,
  id: "10100",
  key: "TEST-100",
  fields: {
    ...mockJiraTicket.fields,
    summary: "User Authentication System Overhaul",
    description: "Complete redesign of the user authentication system including SSO, MFA, and password recovery",
    issuetype: {
      ...mockJiraTicket.fields.issuetype,
      id: "10000",
      name: "Epic",
      iconUrl: "https://test-company.atlassian.net/secure/viewavatar?size=xsmall&avatarId=10312&avatarType=issuetype"
    }
  }
};

export const mockStoryTicket = {
  ...mockJiraTicket,
  id: "10101",
  key: "TEST-101",
  fields: {
    ...mockJiraTicket.fields,
    summary: "Implement SSO Login Flow",
    description: "Create the single sign-on login flow for external identity providers",
    issuetype: {
      ...mockJiraTicket.fields.issuetype,
      id: "10002",
      name: "Story",
      iconUrl: "https://test-company.atlassian.net/secure/viewavatar?size=xsmall&avatarId=10315&avatarType=issuetype"
    },
    parent: {
      id: "10100",
      key: "TEST-100",
      fields: {
        summary: "User Authentication System Overhaul"
      }
    }
  }
};

export const mockTransitions = [
  {
    id: "11",
    name: "To Do",
    to: {
      self: "https://test-company.atlassian.net/rest/api/2/status/1",
      description: "The issue is open and ready for the assignee to start work on it.",
      iconUrl: "https://test-company.atlassian.net/images/icons/statuses/open.png",
      name: "To Do",
      id: "1"
    },
    hasScreen: false,
    isGlobal: true,
    isInitial: false,
    isAvailable: true,
    isConditional: false
  },
  {
    id: "21",
    name: "In Progress",
    to: {
      self: "https://test-company.atlassian.net/rest/api/2/status/3",
      description: "This issue is being actively worked on at the moment by the assignee.",
      iconUrl: "https://test-company.atlassian.net/images/icons/statuses/inprogress.png",
      name: "In Progress",
      id: "3"
    },
    hasScreen: false,
    isGlobal: true,
    isInitial: false,
    isAvailable: true,
    isConditional: false
  },
  {
    id: "31",
    name: "Done",
    to: {
      self: "https://test-company.atlassian.net/rest/api/2/status/10001",
      description: "The issue is closed and solved.",
      iconUrl: "https://test-company.atlassian.net/images/icons/statuses/closed.png",
      name: "Done",
      id: "10001"
    },
    hasScreen: false,
    isGlobal: true,
    isInitial: false,
    isAvailable: true,
    isConditional: false
  }
];

export const mockCreateTicketResponse = {
  id: "10002",
  key: "TEST-124",
  self: "https://test-company.atlassian.net/rest/api/2/issue/10002"
};

export const mockCommentResponse = {
  self: "https://test-company.atlassian.net/rest/api/2/issue/TEST-123/comment/10050",
  id: "10050",
  author: {
    self: "https://test-company.atlassian.net/rest/api/2/user?accountId=557058:f58131cb-b67d-43c7-b30d-6b58d40bd077",
    accountId: "557058:f58131cb-b67d-43c7-b30d-6b58d40bd077",
    emailAddress: "john.doe@example.com",
    displayName: "John Doe",
    active: true
  },
  body: "This is a test comment with *formatted* text",
  updateAuthor: {
    self: "https://test-company.atlassian.net/rest/api/2/user?accountId=557058:f58131cb-b67d-43c7-b30d-6b58d40bd077",
    accountId: "557058:f58131cb-b67d-43c7-b30d-6b58d40bd077",
    emailAddress: "john.doe@example.com",
    displayName: "John Doe",
    active: true
  },
  created: "2024-01-15T15:30:00.000+0000",
  updated: "2024-01-15T15:30:00.000+0000"
};

export const mockIssueLinks = [
  {
    id: "10001",
    self: "https://test-company.atlassian.net/rest/api/2/issueLink/10001",
    type: {
      id: "10000",
      name: "Blocks",
      inward: "is blocked by",
      outward: "blocks",
      self: "https://test-company.atlassian.net/rest/api/2/issueLinkType/10000"
    },
    inwardIssue: {
      id: "10001",
      key: "TEST-123",
      self: "https://test-company.atlassian.net/rest/api/2/issue/TEST-123",
      fields: {
        summary: "Fix user authentication bug",
        status: {
          name: "To Do",
          id: "1"
        },
        issuetype: {
          name: "Task"
        }
      }
    },
    outwardIssue: {
      id: "10002",
      key: "TEST-124",
      self: "https://test-company.atlassian.net/rest/api/2/issue/TEST-124",
      fields: {
        summary: "Update user documentation",
        status: {
          name: "Done",
          id: "10001"
        },
        issuetype: {
          name: "Task"
        }
      }
    }
  }
];

export const mockProjectHierarchyResponse = {
  epic: {
    id: "10100",
    key: "TEST-100",
    self: "https://test-company.atlassian.net/rest/api/2/issue/10100",
    fields: {
      summary: "User Authentication System Overhaul"
    }
  },
  stories: [
    {
      id: "10101",
      key: "TEST-101",
      self: "https://test-company.atlassian.net/rest/api/2/issue/10101",
      fields: {
        summary: "Implement SSO Login Flow"
      },
      tasks: [
        {
          id: "10102",
          key: "TEST-102",
          self: "https://test-company.atlassian.net/rest/api/2/issue/10102",
          fields: {
            summary: "Setup OAuth2 Provider Configuration"
          }
        },
        {
          id: "10103",
          key: "TEST-103",
          self: "https://test-company.atlassian.net/rest/api/2/issue/10103",
          fields: {
            summary: "Create User Migration Scripts"
          }
        }
      ]
    },
    {
      id: "10104",
      key: "TEST-104",
      self: "https://test-company.atlassian.net/rest/api/2/issue/10104",
      fields: {
        summary: "Implement Multi-Factor Authentication"
      },
      tasks: [
        {
          id: "10105",
          key: "TEST-105",
          self: "https://test-company.atlassian.net/rest/api/2/issue/10105",
          fields: {
            summary: "Setup TOTP Authentication"
          }
        }
      ]
    }
  ]
};

export const mockStoryAnalysisResponse = {
  storyKey: "TEST-101",
  currentStatus: "In Progress",
  recommendedStatus: "Done",
  taskSummary: {
    total: 3,
    done: 3,
    inProgress: 0,
    todo: 0
  },
  tasks: [
    {
      key: "TEST-102",
      summary: "Setup OAuth2 Provider Configuration",
      status: "Done"
    },
    {
      key: "TEST-103",
      summary: "Create User Migration Scripts",
      status: "Done"
    },
    {
      key: "TEST-106",
      summary: "Write Integration Tests",
      status: "Done"
    }
  ],
  shouldTransition: true,
  transitionId: "31",
  reasoning: "All child tasks are completed. Story should be marked as Done."
};

export const mockValidationResponse = {
  epicKey: "TEST-100",
  isValid: true,
  structure: {
    epic: {
      key: "TEST-100",
      summary: "User Authentication System Overhaul",
      status: "In Progress"
    },
    stories: [
      {
        key: "TEST-101",
        summary: "Implement SSO Login Flow",
        status: "Done",
        parentKey: "TEST-100",
        taskCount: 3,
        completedTasks: 3
      },
      {
        key: "TEST-104",
        summary: "Implement Multi-Factor Authentication",
        status: "In Progress",
        parentKey: "TEST-100",
        taskCount: 2,
        completedTasks: 1
      }
    ],
    totalStories: 2,
    completedStories: 1,
    totalTasks: 5,
    completedTasks: 4
  },
  issues: [],
  recommendations: [
    "Consider updating epic status based on story completion (1/2 stories done)",
    "Story TEST-104 has incomplete tasks that may need attention"
  ]
};

export const mockErrorResponses = {
  notFound: {
    response: {
      status: 404,
      data: {
        errorMessages: ["Issue Does Not Exist"],
        errors: {}
      }
    }
  },
  unauthorized: {
    response: {
      status: 401,
      data: {
        errorMessages: ["You are not authenticated. Authentication required to perform this operation."],
        errors: {}
      }
    }
  },
  forbidden: {
    response: {
      status: 403,
      data: {
        errorMessages: ["You do not have the permission to see the specified issue."],
        errors: {}
      }
    }
  },
  badRequest: {
    response: {
      status: 400,
      data: {
        errorMessages: [],
        errors: {
          summary: "Summary is required."
        }
      }
    }
  },
  rateLimited: {
    response: {
      status: 429,
      data: {
        errorMessages: ["Rate limit exceeded. Please try again later."],
        errors: {}
      }
    }
  }
};
