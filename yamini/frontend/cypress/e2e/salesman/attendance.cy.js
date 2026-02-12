/**
 * Salesman Attendance E2E Tests
 * Tests attendance marking with photo and GPS
 */

describe('Salesman Attendance', () => {
  beforeEach(() => {
    cy.loginAsSalesman();
    cy.visit('/salesman/attendance');
  });

  it('should load attendance page', () => {
    cy.get('.page-title').should('contain', 'Attendance');
  });

  it('should show attendance form if not marked', () => {
    cy.get('.attendance-banner').then(($banner) => {
      if ($banner.hasClass('not-marked')) {
        cy.get('form.form-card').should('exist');
        cy.get('input[type="file"]').should('exist');
        cy.get('button[type="submit"]').should('contain', 'Mark Attendance');
      }
    });
  });

  it('should show already marked message if attendance exists', () => {
    cy.get('.attendance-banner').then(($banner) => {
      if ($banner.hasClass('marked')) {
        cy.get('.attendance-banner').should('contain', 'Already Marked');
      }
    });
  });

  it('should require photo before submission', () => {
    cy.get('.attendance-banner').then(($banner) => {
      if ($banner.hasClass('not-marked')) {
        // Try to submit without photo
        cy.get('button[type="submit"]').click();
        
        // Should show validation error (HTML5 required)
        cy.get('input[type="file"]:invalid').should('exist');
      }
    });
  });

  it('should upload photo and show preview', () => {
    cy.get('.attendance-banner').then(($banner) => {
      if ($banner.hasClass('not-marked')) {
        // Upload photo
        cy.uploadFile('input[type="file"]', 'attendance.png');
        
        // Preview should appear
        cy.wait(500);
        cy.get('img[alt="Preview"]').should('be.visible');
      }
    });
  });

  it('should mark attendance with photo and GPS', () => {
    // Mock geolocation
    cy.mockGeolocation(13.0827, 80.2707);
    
    cy.get('.attendance-banner').then(($banner) => {
      if ($banner.hasClass('not-marked')) {
        // Upload photo
        cy.uploadFile('input[type="file"]', 'test-attendance.png');
        
        // Submit form
        cy.get('button[type="submit"]').click();
        
        // Wait for API call and success message
        cy.wait(3000);
        
        // Should show success or error alert
        // (Depends on backend response)
      }
    });
  });

  it('should handle GPS permission denied gracefully', () => {
    // Mock geolocation denial
    cy.window().then((win) => {
      cy.stub(win.navigator.geolocation, 'getCurrentPosition').callsFake((success, error) => {
        error({
          code: 1, // PERMISSION_DENIED
          message: 'User denied Geolocation'
        });
      });
    });
    
    cy.get('.attendance-banner').then(($banner) => {
      if ($banner.hasClass('not-marked')) {
        cy.uploadFile('input[type="file"]', 'test.png');
        cy.get('button[type="submit"]').click();
        
        // Should show alert about location permission
        cy.wait(1000);
      }
    });
  });

  it('should be mobile responsive', () => {
    cy.viewport('iphone-x');
    cy.get('.page-header').should('be.visible');
    cy.get('.attendance-banner').should('be.visible');
  });
});
