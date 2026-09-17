# Deployment

## Infrastructure

The Passkey Reservation Orchestrator Client is deployed as a Java library artifact to Cvent's internal Maven repository. It does not run as a standalone service but is consumed by other applications.

### Artifact Repository
- **Repository**: Cvent Internal Nexus
- **Group ID**: `com.cvent.passkey`
- **Artifact ID**: `passkey-reservation-orch-client`
- **Packaging**: JAR

## Environments

### Development
- **Purpose**: Local development and testing
- **API Endpoint**: `https://housing-api-alpha.passkey.com/bookings/`
- **Access**: Available to all developers
- **Data**: Test data and synthetic reservations

### Alpha
- **Purpose**: Integration testing and early validation
- **API Endpoint**: `https://housing-api-alpha.passkey.com/bookings/`
- **Access**: Development teams and QA
- **Data**: Staging data with realistic scenarios

### Beta
- **Purpose**: Pre-production validation
- **API Endpoint**: `https://housing-api-beta.passkey.com/bookings/`
- **Access**: Limited beta users and stakeholders
- **Data**: Production-like data with restricted access

### Production
- **Purpose**: Live customer operations
- **API Endpoint**: `https://housing-api.passkey.com/bookings/`
- **Access**: Production applications only
- **Data**: Live customer reservations and transactions

## CI/CD Pipeline

### Jenkins Configuration
- **Pipeline**: [passkey-cdk/passkey-reservation-orch-client](https://ci-jenkins.core.cvent.org/job/passkey-cdk/job/passkey-reservation-orch-client/)
- **Trigger**: Git push to main branch
- **Stages**: Build → Test → Quality Gates → Deploy

### Build Process
1. **Checkout**: Source code retrieval from GitHub
2. **Compile**: Maven compilation with Java 11
3. **Test**: Unit test execution with JUnit 5
4. **Coverage**: Code coverage analysis with JaCoCo
5. **Quality**: SonarQube analysis and quality gates
6. **Package**: JAR artifact creation
7. **Deploy**: Artifact deployment to Nexus repository

### Quality Gates
- **Code Coverage**: Minimum 80% line coverage
- **SonarQube**: No critical or major issues
- **Security**: Dependency vulnerability scanning
- **Tests**: All unit tests must pass

## Release Process

### Version Strategy
- **Format**: MAJOR.MINOR.PATCH-SNAPSHOT
- **Current**: 1.11.20-SNAPSHOT
- **Release**: Automated through Jenkins pipeline

### Release Steps
1. **Feature Complete**: All features merged to main
2. **Quality Validation**: All quality gates passed
3. **Version Bump**: Update version in pom.xml
4. **Tag Creation**: Git tag for release version
5. **Artifact Deploy**: Release artifact to Nexus
6. **Documentation**: Update changelog and release notes

### Rollback Procedures
Since this is a library, rollback involves:
1. **Identify Issue**: Determine problematic version
2. **Revert Consumers**: Update consuming applications to previous version
3. **Hotfix**: Create hotfix branch if needed
4. **Emergency Release**: Fast-track critical fixes

## Configuration Management

### Environment Variables
The library itself doesn't use environment variables, but consuming applications may configure:
- `PASSKEY_API_BASE_URL` - Override default API endpoint
- `PASSKEY_API_KEY` - API authentication key
- `PASSKEY_TIMEOUT_SECONDS` - Operation timeout override

### Application Properties
Consuming applications typically configure:
```properties
# Passkey API Configuration
passkey.api.baseUrl=https://housing-api.passkey.com/bookings/
passkey.api.key=${PASSKEY_API_KEY}
passkey.api.timeout=60

# Connection Pool Settings
passkey.client.maxConnections=50
passkey.client.connectionTimeout=30
```

### Spring Boot Integration
For Spring Boot applications:
```yaml
passkey:
  reservation-client:
    base-url: https://housing-api.passkey.com/bookings/
    api-key: ${PASSKEY_API_KEY}
    timeout: 60s
    retry:
      max-attempts: 3
      backoff: 1s
```

## Monitoring and Alerting

### Application Metrics
Consuming applications should monitor:
- **Request Volume**: Number of API calls per minute
- **Response Times**: Average and 95th percentile latencies
- **Error Rates**: HTTP 4xx and 5xx response percentages
- **Success Rates**: Successful operation completion rates

### Health Checks
Recommended health check implementation:
```java
@Component
public class PasskeyClientHealthIndicator implements HealthIndicator {
    
    @Override
    public Health health() {
        try {
            // Simple connectivity test
            reservationClient.healthCheck();
            return Health.up()
                .withDetail("api", "accessible")
                .build();
        } catch (Exception e) {
            return Health.down()
                .withDetail("error", e.getMessage())
                .build();
        }
    }
}
```

### Alerting Thresholds
- **Error Rate**: > 5% over 5 minutes
- **Response Time**: > 10 seconds average over 5 minutes
- **Availability**: < 99% over 15 minutes

## Security Considerations

### API Key Management
- Store API keys in secure configuration management
- Rotate keys regularly (quarterly recommended)
- Use different keys per environment
- Monitor key usage and access patterns

### Network Security
- All communication over HTTPS/TLS 1.2+
- Firewall rules restricting outbound access
- VPN or private network connectivity where possible

### Dependency Management
- Regular dependency updates for security patches
- Vulnerability scanning in CI/CD pipeline
- WhiteSource integration for license compliance

## Troubleshooting

### Common Issues

#### Connection Timeouts
- **Symptom**: Operations timing out
- **Cause**: Network connectivity or API performance
- **Resolution**: Check network connectivity, increase timeout values

#### Authentication Failures
- **Symptom**: 401 Unauthorized responses
- **Cause**: Invalid or expired API key
- **Resolution**: Verify API key configuration and rotation

#### Rate Limiting
- **Symptom**: 429 Too Many Requests responses
- **Cause**: Exceeding API rate limits
- **Resolution**: Implement backoff strategy, reduce request frequency

### Diagnostic Tools
- **Logs**: Enable DEBUG logging for detailed request/response information
- **Network**: Use tools like curl or Postman to test API connectivity
- **Monitoring**: Check application metrics and health endpoints

### Support Contacts
- **Primary Team**: Steakholders (`#passkey-steak-holders`)
- **Secondary Team**: Cherrypickers (`#passkey-cherrypickers`)
- **On-Call**: Follow Cvent escalation procedures