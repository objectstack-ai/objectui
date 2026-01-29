# ObjectUI Development Roadmap

**Based on ObjectStack Spec v0.6.1 Standard Protocol**

> 📅 Last Updated: 2026-01-29  
> 📋 Current Version: ObjectUI v0.3.1  
> 🎯 Target Version: ObjectUI v1.0.0 (Full ObjectStack Spec v0.6.1 Compliance)

---

## 📊 Executive Summary

ObjectUI is a Universal Server-Driven UI (SDUI) Engine built on React + Tailwind + Shadcn, committed to becoming the official frontend renderer for the ObjectStack ecosystem.

**Current Status:**
- ✅ Core Features Implemented: 60+ UI components, 14 plugins, complete rendering engine
- ⚠️ Protocol Version Lag: Using @objectstack/spec v0.3.3, needs upgrade to v0.6.1
- 🔄 Feature Coverage: ~65% of UI protocol implemented, needs System/API/AI protocol support

**Strategic Goals:**
1. **100% ObjectStack Spec Compliance**: Become the reference implementation for the standard protocol
2. **Enterprise Production Ready**: Achieve 85%+ test coverage, complete documentation
3. **Ecosystem Integration**: Seamless integration with Steedos, Salesforce, and other ObjectStack backends

---

## 🔍 Implemented Features Audit

### ✅ Completed Core Features

#### 1. Type System (`@object-ui/types`)
- **Status**: ✅ Basic complete, but based on old protocol (v0.3.3)
- **Implementation**:
  - 60+ component schema definitions
  - 25+ field type definitions
  - CRUD operation interfaces
  - ObjectQL integration types
- **Gaps**:
  - Not using latest v0.6.1 protocol
  - Missing System, API, AI protocol types
  - Incomplete Zod schema validation

#### 2. Core Engine (`@object-ui/core`)
- **Status**: ✅ Core functionality complete
- **Implementation**:
  - Component registry system
  - Schema validation engine
  - Expression evaluator (supports `${}` template syntax)
  - Action execution system (ActionRunner)
  - Data scope management (DataScope)
  - Security sandbox (blocks dangerous code execution)
- **Test Coverage**: 
  - ExpressionEvaluator: ✅ Complete tests
  - FilterConverter: ✅ Complete tests
  - Security: ✅ Complete tests

#### 3. React Renderer (`@object-ui/react`)
- **Status**: ✅ Core rendering complete
- **Implementation**:
  - `<SchemaRenderer>` core component
  - Dynamic component resolution
  - Props mapping and binding
  - Context providers
  - Hooks system (`useDataScope`)

#### 4. UI Component Library (`@object-ui/components`)
- **Status**: ✅ Rich component collection (60+ components)
- **Categories**:
  - **Layout** (12): div, container, flex, stack, grid, card, tabs, scroll-area, etc.
  - **Form** (17): input, textarea, button, checkbox, radio, select, date-picker, etc.
  - **Data Display** (12): table, data-table, list, markdown, chart, timeline, etc.
  - **Feedback** (8): spinner, progress, skeleton, toast, loading, etc.
  - **Overlay** (11): dialog, sheet, drawer, popover, tooltip, etc.
  - **Navigation** (6): breadcrumb, pagination, navigation-menu, etc.

#### 5. Field Renderers (`@object-ui/fields`)
- **Status**: ✅ Supports 25+ field types
- **Implementation**:
  - Type-aware cell renderers
  - Custom editing support
  - Formatted display (currency, percentage, date)
  - Field validation integration

#### 6. Plugin System (14 plugins)
- **Status**: ✅ Core plugins complete
- **Implemented Plugins**:
  1. `plugin-form`: ObjectForm (schema-driven forms)
  2. `plugin-grid`: ObjectGrid (data grid with CRUD)
  3. `plugin-view`: ObjectView (generic ObjectQL views)
  4. `plugin-kanban`: Kanban boards (drag & drop)
  5. `plugin-calendar`: Calendar component
  6. `plugin-gantt`: Gantt charts
  7. `plugin-charts`: Charts (based on Recharts)
  8. `plugin-dashboard`: Dashboard system
  9. `plugin-timeline`: Timeline
  10. `plugin-markdown`: Markdown rendering
  11. `plugin-editor`: Monaco code editor
  12. `plugin-chatbot`: Chat interface
  13. `plugin-map`: Map visualization
  14. `plugin-aggrid`: AG Grid integration

#### 7. Data Integration (`@object-ui/data-objectstack`)
- **Status**: ✅ ObjectStack adapter complete
- **Implementation**:
  - Full CRUD operation support
  - OData query parameter support (`$filter`, `$orderby`, `$top`, `$skip`)
  - Metadata fetching
  - Filter conversion (OData → AST)

#### 8. CLI Tool (`@object-ui/cli`)
- **Status**: ✅ Basic CLI features complete
- **Commands**:
  - `init`: Initialize project
  - `serve`/`dev`: Development server
  - `build`: Production build
  - `lint`, `test`, `check`: Code quality tools
  - `studio`: Visual builder (planned)

---

## 🎯 ObjectStack Spec v0.6.1 Protocol Requirements

### UI Protocol (`@objectstack/spec/ui`)

| Schema | Current | Completeness | Priority |
|--------|---------|-------------|----------|
| **AppSchema** | ❌ Not implemented | 0% | 🔴 High |
| **PageSchema** | ⚠️ Partial | 40% | 🔴 High |
| **ViewSchema** | ⚠️ Partial | 60% | 🔴 High |
| **ComponentSchema** | ⚠️ Partial | 70% | 🔴 High |
| **BlockSchema** | ❌ Not implemented | 0% | 🔴 High |
| **ActionSchema** | ⚠️ Partial | 50% | 🔴 High |
| **DashboardSchema** | ⚠️ Partial | 60% | 🟡 Medium |
| **ReportSchema** | ❌ Not implemented | 0% | 🟡 Medium |
| **WidgetSchema** | ⚠️ Partial | 40% | 🟡 Medium |
| **ThemeSchema** | ❌ Not implemented | 0% | 🟢 Low |

### Data Protocol (`@objectstack/spec/data`)

| Schema | Current | Completeness | Priority |
|--------|---------|-------------|----------|
| **ObjectSchema** | ⚠️ Partial | 50% | 🔴 High |
| **FieldSchema** | ⚠️ Partial | 70% | 🔴 High |
| **QuerySchema** | ⚠️ Partial | 60% | 🔴 High |
| **FilterSchema** | ⚠️ Partial | 70% | 🔴 High |
| **ValidationSchema** | ⚠️ Partial | 50% | 🟡 Medium |
| **DriverInterface** | ⚠️ Partial | 40% | 🟡 Medium |
| **DatasourceSchema** | ⚠️ Partial | 50% | 🟡 Medium |

### System Protocol (`@objectstack/spec/system`)

| Schema | Current | Completeness | Priority |
|--------|---------|-------------|----------|
| **ManifestSchema** | ❌ Not implemented | 0% | 🟡 Medium |
| **IdentitySchema** | ❌ Not implemented | 0% | 🟡 Medium |
| **PluginSchema** | ⚠️ Partial | 30% | 🟡 Medium |
| **EventSchema** | ❌ Not implemented | 0% | 🟡 Medium |

### API Protocol (`@objectstack/spec/api`)

| Schema | Current | Completeness | Priority |
|--------|---------|-------------|----------|
| **EndpointSchema** | ❌ Not implemented | 0% | 🟡 Medium |
| **ContractSchema** | ❌ Not implemented | 0% | 🟢 Low |
| **DiscoverySchema** | ❌ Not implemented | 0% | 🟢 Low |
| **RealtimeSchema** | ❌ Not implemented | 0% | 🟢 Low |

### AI Protocol (`@objectstack/spec/ai`)

| Schema | Current | Completeness | Priority |
|--------|---------|-------------|----------|
| **AgentSchema** | ❌ Not implemented | 0% | 🟡 Medium |
| **RAGPipelineSchema** | ❌ Not implemented | 0% | 🟢 Low |
| **ModelSchema** | ❌ Not implemented | 0% | 🟢 Low |
| **PromptSchema** | ❌ Not implemented | 0% | 🟢 Low |

---

## 🗓️ Phased Development Plan

### 🔥 Phase 1: Protocol Upgrade (Q1 2026 - Week 1-2) - CRITICAL

**Goal**: Upgrade all packages to ObjectStack Spec v0.6.1

**Tasks**:
- [ ] **1.1**: Upgrade `@object-ui/types` dependencies
  - [ ] Update package.json: `@objectstack/spec` v0.3.3 → v0.6.1
  - [ ] Re-export all protocol namespaces (Data, UI, System, AI, API)
  
- [ ] **1.2**: Update `@object-ui/core` dependencies
  - [ ] Upgrade to v0.6.1
  - [ ] Verify schema validator compatibility
  
- [ ] **1.3**: Update `@object-ui/react` dependencies
  - [ ] Upgrade to v0.6.1
  - [ ] Verify renderer compatibility
  
- [ ] **1.4**: Run full test suite
  - [ ] Fix all breaking changes
  - [ ] Ensure 100% test pass rate
  
- [ ] **1.5**: Update documentation
  - [ ] Add migration guide
  - [ ] Update API documentation references

**Success Criteria**:
- ✅ All packages use @objectstack/spec v0.6.1
- ✅ All tests passing
- ✅ Zero breaking changes (backward compatible)

---

### 🎨 Phase 2: Complete UI Protocol (Q1 2026 - Week 3-6)

#### Key Deliverables:
- [ ] Implement `AppSchema` (navigation, branding, routing)
- [ ] Complete `PageSchema` (layouts, breadcrumbs, permissions)
- [ ] Complete `ViewSchema` (all view types: list, detail, grid, kanban, calendar)
- [ ] Implement `ComponentSchema` & `BlockSchema` (reusable blocks)
- [ ] Complete `ActionSchema` (ajax, confirm, dialog, action chains)
- [ ] Enhance `DashboardSchema` & `WidgetSchema` (drag-drop layout)
- [ ] Implement `ReportSchema` (data aggregation, export)
- [ ] Implement `ThemeSchema` (dynamic theming)

**Success Criteria**:
- ✅ UI protocol coverage ≥ 90%
- ✅ All core UI schemas fully implemented
- ✅ Test coverage ≥ 85%

---

### 📊 Phase 3: Complete Data Protocol (Q1-Q2 2026 - Week 7-10)

#### Key Deliverables:
- [ ] Complete `ObjectSchema` (inheritance, triggers, permissions)
- [ ] Complete `FieldSchema` (all field types, dependencies, formulas)
- [ ] Implement full `QuerySchema` AST (subqueries, joins, aggregations)
- [ ] Enhance `FilterSchema` (complex logic, date ranges, full-text search)
- [ ] Implement `ValidationSchema` (custom validators, async validation)
- [ ] Extend `DriverInterface` (transactions, connection pooling, caching)
- [ ] Complete `DatasourceSchema` (multi-source management, health checks)

**Success Criteria**:
- ✅ Data protocol coverage ≥ 90%
- ✅ Full ObjectQL compatibility
- ✅ Performance benchmarks passed

---

### 🔐 Phase 4: System Protocol Support (Q2 2026 - Week 11-14)

#### Key Deliverables:
- [ ] Implement `ManifestSchema` (config file parsing, validation)
- [ ] Implement `IdentitySchema` (authentication, RBAC, field-level permissions)
- [ ] Complete `PluginSchema` (lifecycle, hot-reload, marketplace)
- [ ] Implement `EventSchema` (event bus, webhooks, pub-sub)

**Success Criteria**:
- ✅ System protocol coverage ≥ 80%
- ✅ Permission system fully functional
- ✅ Plugin system stable

---

### 🌐 Phase 5: API Protocol Support (Q2 2026 - Week 15-16)

#### Key Deliverables:
- [ ] Implement `EndpointSchema` (REST/GraphQL endpoints, validation)
- [ ] Implement `DiscoverySchema` (service discovery, metadata sync)
- [ ] Implement `RealtimeSchema` (WebSocket, real-time sync, collaborative editing)

**Success Criteria**:
- ✅ API protocol baseline implementation complete
- ✅ Real-time communication stable

---

### 🤖 Phase 6: AI Protocol Support (Q3 2026 - Week 17-20)

#### Key Deliverables:
- [ ] Implement `AgentSchema` (LLM integration, tool calling, monitoring)
- [ ] Implement `RAGPipelineSchema` (vector DB, document indexing, semantic search)
- [ ] Implement `ModelSchema` & `PromptSchema` (model registry, prompt versioning, A/B testing)

**Success Criteria**:
- ✅ AI features baseline functional
- ✅ Integration with major LLM platforms

---

### 🧪 Phase 7: Test Coverage Enhancement (Ongoing)

**Goal**: Achieve 85%+ test coverage

**Task Breakdown**:
- [ ] **Unit Tests**: All new modules, edge cases, error handling
- [ ] **Integration Tests**: Component interactions, data flow, plugin integration
- [ ] **E2E Tests** (Playwright): CRUD flows, form submission, permissions, navigation
- [ ] **Performance Tests**: Large datasets, complex queries, memory leaks
- [ ] **Security Tests**: XSS protection, SQL injection prevention, permission bypass

**Success Criteria**:
- ✅ Unit test coverage ≥ 85%
- ✅ Critical path E2E tests 100%
- ✅ Zero known security vulnerabilities

---

### 📚 Phase 8: Documentation Enhancement (Q2-Q3 2026)

**Deliverables**:
- [ ] Auto-generated TypeScript API docs
- [ ] ObjectStack Spec mapping documentation
- [ ] Migration guides (from Amis, Formily, version upgrades)
- [ ] Best practices (performance, security, component development)
- [ ] Bilingual documentation (English + Chinese)

**Success Criteria**:
- ✅ Documentation covers all public APIs
- ✅ Every component has at least 1 example
- ✅ English/Chinese docs in sync

---

### ⚡ Phase 9: Performance Optimization (Q3-Q4 2026)

**Focus Areas**:
- [ ] **Rendering**: Virtual scrolling, memoization, progressive rendering
- [ ] **Bundle Size**: Tree-shaking, code splitting, asset compression
- [ ] **Runtime**: Expression evaluation, schema validation, query caching
- [ ] **Build**: Vite optimization, Turbo incremental builds

**Performance Targets**:
- ✅ First contentful paint < 1.5s (3G network)
- ✅ Main bundle < 50KB (gzip)
- ✅ 1000-row table render < 100ms
- ✅ Build speed improvement 50%

---

## 📈 Key Performance Indicators (KPIs)

### Technical Metrics
- **Protocol Compliance**: 100% ObjectStack Spec v0.6.1 compatible
- **Test Coverage**: ≥ 85% unit + integration tests
- **Performance**: 
  - First contentful paint < 1.5s
  - Main bundle < 50KB (gzip)
- **Documentation**: 100% public API documented

### Ecosystem Metrics
- **Example Apps**: ≥ 5 production-grade examples
- **Plugin Ecosystem**: ≥ 20 community plugins
- **Adapters**: ≥ 3 backend adapters (ObjectStack, REST, GraphQL)

### Community Metrics
- **GitHub Stars**: ≥ 1,000
- **NPM Downloads**: ≥ 10k/month
- **Contributors**: ≥ 20 active contributors

---

## 🚧 Risks & Mitigation Strategies

### Risk 1: Protocol Upgrade Breaking Changes
**Impact**: High  
**Mitigation**: 
- Provide detailed migration guide
- Implement backward compatibility layer
- Provide automated migration tools

### Risk 2: Performance Regression
**Impact**: Medium  
**Mitigation**:
- Run performance benchmarks on every PR
- Set performance budgets (bundle size, load time)
- Continuous performance monitoring

### Risk 3: Insufficient Test Coverage
**Impact**: High  
**Mitigation**:
- Enforce PR test coverage requirements
- Regular test coverage reviews
- Prioritize critical path testing

### Risk 4: Documentation Lag
**Impact**: Medium  
**Mitigation**:
- Documentation submitted with code changes
- Auto-generate API documentation
- Regular documentation review meetings

---

## 📅 Milestones

| Milestone | Target Date | Key Deliverables |
|-----------|------------|------------------|
| **M1: Protocol Upgrade Complete** | 2026-02-15 | All packages on v0.6.1 |
| **M2: UI Protocol 90% Complete** | 2026-03-31 | All core UI schemas implemented |
| **M3: Data Protocol 90% Complete** | 2026-04-30 | Full ObjectQL compatibility |
| **M4: Beta Release** | 2026-05-31 | v1.0.0-beta.1 |
| **M5: System Protocol Complete** | 2026-06-30 | Permissions, plugins polished |
| **M6: API Protocol Complete** | 2026-07-31 | Real-time, service discovery |
| **M7: AI Protocol Complete** | 2026-09-30 | Agent, RAG baseline |
| **M8: v1.0.0 GA Release** | 2026-10-31 | Production-ready version |

---

## 🤝 Team & Resources

### Core Team Roles
- **Architect** (1): Protocol design, technical decisions
- **Frontend Engineers** (2-3): Component development, rendering engine
- **Full-stack Engineers** (1-2): Data integration, backend adapters
- **QA Engineer** (1): Test strategy, quality assurance
- **Technical Writer** (1): Documentation, examples

### Resource Requirements
- **Development**: Vercel/Netlify deployment, CI/CD
- **Testing**: BrowserStack (cross-browser testing)
- **Monitoring**: Sentry (error tracking), Lighthouse (performance)

---

## 📞 Contact & Feedback

- **GitHub Issues**: [https://github.com/objectstack-ai/objectui/issues](https://github.com/objectstack-ai/objectui/issues)
- **Email**: hello@objectui.org

---

**Last Updated**: 2026-01-29  
**Document Version**: v1.0  
**Maintained by**: ObjectUI Core Team
