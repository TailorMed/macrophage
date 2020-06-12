# Macrophage - an API-level test-macro runner

## Disclaimer

This is a very preliminary version, taking the common-parts that do not contain secret sauce from a proprietary project.

**WARNING:** As the version testifies - the project is in very early stages and very far from production grade.
APIs and expected config structures are prone to change.

**Current status:** 
Current status is that the tool in its current form works with the proprietary project from which it's been separated, however -  a lot of generization work is yet to be done. The tool still assumes a lot of concrete implementation details that do not include secret sauce, but are in fact concrete to the parent project from which it is separated.

The good news is that we're making progress.
I have added a lot of information in the readme, but it's mostly for me to remember were we're going and where we're heading.

## Overview
- CLI tool that runs API-level tests described in a profile, emit JSON-stream log, and exits with an exit-code reflecting success or failrure.
- A profile is a collection of Test-Suites and configuration for the clients they require, and generic settings for the macrophage tool.
- Test Suites are described using a simplified yaml-based macro-language
- Suites are built as a collection of Steps, which are built as a collection of directives, each is a modular generic unit reused in the execution chain the profile describes, and constructed with options provided by the user.
- The tool comes with `request-promise` as default built-in client for quick-start, but is aimed to be used with custom clients provided as user-models that encapsule the lower level api-logic and produce a human-readable suite config.
- Responses retrieved by clients are asserted using a simple generic declarative language, in which the user provides paths on the response, and configuration for checkers that perform  assertion against it. (e.g. `responseTime: { 'lesserThan': 0.5s }`, or `statusCode: { gte : 200, lt: 400 }`)
- For cases the structure cannot be asserted simply by structure, the tool support an `onResponse` hook aimd to let users transform the response returned by the client to a structure that can be asserted declaratively. The hook may mutate the response and return nothing, or return a representing view that should be used as result to be checked.
- As last resort, users can write custom checkers. This last resort is discouraged because they cannot be validated well before suites-execution starts, and may end with errors that are not related to performed claims.

## Lifecycle
1. **Configuration**
  - the stage gathers all inputs from config files, environment variables and CLI-args. Any cascading logic between them happens here.
  - logger is initiated immediately after.
  - This stege should *fail-fast* with a descriptive error when configurations cannot be parsed, loaded or found.
  - In the end of this stage all the configurations have been consolidated into a single model, a logger has been initiated, and the macrophage should start process the execution-profile.

2. **Clients Initiation**
  - Client modules are loaded, constructed and initiated according to user configuration.
  - This stege should *fail-fast* with a descriptive error whenever a client module could not be found, loaded or initiated.
  - The client initiation happens here so that suite-constructions can validate the client apis named in them.

3. **Construction**
  - The configuration tree is traversed.
  Section by section, syntax-suggar rules are applied to obtain a normalized config object, and the relevant software components are initialized.
  - when a user-module is named - it is loaded and validated as far as possible.
  - This stege should *fail-fast* with a descriptive error when a section in the configuration is of an unexpected type or lacks mandatory parts and the section cannot be normalized with defaults.
  - In the end of this stage all the step directives that should be executed are constructed and ready to fire, almost as one big chain.

4. **Execution**
  - Steps from all the suites that have been loaded are executed. Each step calls a client-api, and asserts the claims made on the expected response.
  - All claims are emitted to a reporter constructed on stage 2.
  - Rejected claims emit log warnings.
  - The only execution errors possible in this stage are runtime erors of user-modules which could not have been validated before suite execution comenced. (existence of APIs are validated in stages 2 and 3).
  - In the end of this stage all the directives have been fired, and their results emitted to the reporter.

5. **Result**
  - The reporter compiles and prints a summary report.
  - Here the tool exits with exit-code of number of rejected claims. (no rejects = happy exit with code 0).

## Configuration

Order of configuration loading - last one cascades.
 - **baked-in defaults**
   provide default log levels and pretty-print options which are disregarded as long as pretty-print is not set to true.
 - **seed cli-args && env-vars**
   cli-args that are relevant to loading 
 - **loading suites**
   when suites is not an object - i.e - string or array of strings - they are passed to `require-yml`.
   
 - **cli-args && env-vars**

## logging
There are two types of logging.
 - **Production-grade**
   json-stream log based on `pino`, directed for log-centralizations (logstash/filebeat/fluentd) aimed for actionable alerts based on log-entries.
 - Debugs based on `debug`, aimed to help automation-developers to understand the implictions of the constructs they create and the user-modules they provide.

## user modules
Helper modules are clients and suite-helpers.

- Modules can be pointed as relative paths, or npm package names.
- Absolute paths are discouraged. They work now, but only thanks to an implementation detail which is not part of the API.

Supported initiation patterns:
   - singleton -the  module exports an object with methods which is the client, ready for use.
      e.g:
      ```javascript
      const client = require(moduleName)
      await client.operation(args)
      ```
      may be configured as:
      ```yaml
      clients:
        axios:
          module:     axios
        rp:
          module:     request-promise
      ```
   - singleton + init - the module exports an object with methods which is the client, but one of them must be called first with options as an initiation.
      e.g:
      ```javascript
      const client = require(moduleName)
      await client.init(initOptions)
      await client.operation(args)
      ```
      may be configured as:
      ```yaml
      clients:
        users:
          module:           ./dal/users
          initOptions:
            host:           users-svc.local
            port:           8089
            apiKey:         ghjk-fgdsqa/32fdas-21234r==!!
      ```
   - factory-function - the module exports a factory function is expected to be called with options and returns an instance.
      e.g:
      ```javascript
      const client = require(moduleName)(factoryOptions)
      await client.operation(args)
      ```
      may be configured as:
      ```yaml
      clients:
        scheduler:
          module:           ./dal/scheduler
          factoryOptions:
            host:           scheduler.local
            port:           8094
            apiKey:         ghjk-fgdsqa/32fdas-21234r==!!
      ```
   - factory-function + init- the module exports a factory function is expected to be called with options and returns an instance that has to be initiated.
      e.g:
      ```javascript
      const client = require(moduleName)(factoryOptions)
      await client.init(initOptions)
      await client.operation(args)
      ```
      may be configured as:
      ```yaml
      clients:
        agents:
          module:           ./stress/agents-broker
          factoryOptions:
            poolSize:       64
          initOptions:
            env:            ci
            port:           44911
      ```     
   - factory-module - module exports a singleton with a factory function that returns an instance which is the client ready-for-use.
     
     **NOTE:** still wip, but will be supported eventually...
      e.g:
      ```javascript
      const client = require(moduleName).create(factoryOptions)
      await client.operation(args)
      ```
      may be configured as:
      ```yaml
      clients:
        cache:
          module:           async-redis
          factoryMethod:    createClient
          factoryOptions:
            host:           redis.local
            port:           6379
            password:       makeC1W0rk!!
      ```
   - factory-model - module exports a singleton with a factory function that returns an instance which is the client, but the client must be initiated.
     
     **NOTE:** still wip, but will be supported eventually...
      e.g:
      ```javascript
      const client = require(moduleName).create(factoryOptions)
      await client.init(initOptions)
      await client.operation(args)
      ```
      may be configured as:
      ```yaml
      clients:
        cache:
          module:           ./dal/counters
          factoryMethod:    create
          factoryOptions:
            poolSize:       3
            host:           redis.local
            port:           6379
            password:       makeC1W0rk!!
          initMethod:       init
          initOptions:      {}      //you have to provide it even if no params are required
                                    //this is what causes the `initMethod` to be called.
          
      ```

## Roadmap
- Integral support for open-api-spec (f.k.a swagger) clients
- Integral support for advanced checkers
- Support for custom reporter
