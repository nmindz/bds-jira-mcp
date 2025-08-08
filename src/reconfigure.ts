#!/usr/bin/env node

import { JiraMcpSetup } from './setup.js';

// Always force reconfiguration
const setup = new JiraMcpSetup(true);
setup.run();
