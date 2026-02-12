import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/constants/route_constants.dart';

/// Yamini Infotech - Premium Enterprise Splash Screen
///
/// Safe, Stable Animation Sequence (~2.5-3s total):
/// 1. Dark tech background fades in (0-300ms)
/// 2. Translucent tech panels slide in from different directions (300ms-1200ms)
/// 3. Panels briefly overlap center, then fade out (1200ms-1600ms)
/// 4. Logo appears with fade + subtle scale 1.03→1.0 (1400ms-1800ms)
/// 5. App name "YAMINI INFOTECH" fades in below (1800ms-2200ms)
/// 6. Smooth fade transition to login (2500ms-3000ms)
///
/// Design Principles:
/// - Logo is ONE image, never split/cropped/masked
/// - All animations happen AROUND the logo, not inside it
/// - Ease-out curves only - no bounce, no rotation
/// - Performance-safe for all devices
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  // Animation Controllers
  late AnimationController _backgroundController;
  late AnimationController _panelsController;
  late AnimationController _logoController;
  late AnimationController _textController;
  late AnimationController _exitController;

  // Background Animations
  late Animation<double> _backgroundOpacity;

  // Panel Animations (3 tech panels)
  late Animation<Offset> _bluePanelSlide;
  late Animation<Offset> _pinkPanelSlide;
  late Animation<Offset> _yellowPanelSlide;
  late Animation<double> _panelsOpacity;

  // Logo Animations
  late Animation<double> _logoOpacity;
  late Animation<double> _logoScale;

  // Text Animations
  late Animation<double> _textOpacity;
  late Animation<Offset> _textSlide;

  // Exit Animation
  late Animation<double> _exitOpacity;

  // Brand Colors
  static const Color _cyanAccent = Color(0xFF5BC0EB);
  static const Color _magentaAccent = Color(0xFFE91E8C);
  static const Color _yellowAccent = Color(0xFFF9ED32);
  static const Color _darkBackground = Color(0xFF0D1B2A);
  static const Color _darkSecondary = Color(0xFF1B263B);

  @override
  void initState() {
    super.initState();
    _initAnimations();
    _runSequence();
  }

  void _initAnimations() {
    // Background fade in (300ms)
    _backgroundController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _backgroundOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _backgroundController, curve: Curves.easeOut),
    );

    // Tech panels animation (900ms)
    _panelsController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );

    // Blue panel: slides from left
    _bluePanelSlide =
        Tween<Offset>(begin: const Offset(-1.5, 0.0), end: Offset.zero).animate(
          CurvedAnimation(
            parent: _panelsController,
            curve: const Interval(0.0, 0.6, curve: Curves.easeOut),
          ),
        );

    // Pink panel: slides from right
    _pinkPanelSlide =
        Tween<Offset>(begin: const Offset(1.5, 0.0), end: Offset.zero).animate(
          CurvedAnimation(
            parent: _panelsController,
            curve: const Interval(0.1, 0.7, curve: Curves.easeOut),
          ),
        );

    // Yellow panel: slides from bottom
    _yellowPanelSlide =
        Tween<Offset>(begin: const Offset(0.0, 1.5), end: Offset.zero).animate(
          CurvedAnimation(
            parent: _panelsController,
            curve: const Interval(0.2, 0.8, curve: Curves.easeOut),
          ),
        );

    // Panels fade out after reaching center
    _panelsOpacity = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween<double>(
          begin: 0.0,
          end: 0.25,
        ).chain(CurveTween(curve: Curves.easeOut)),
        weight: 50,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 0.25, end: 0.25),
        weight: 20,
      ),
      TweenSequenceItem(
        tween: Tween<double>(
          begin: 0.25,
          end: 0.0,
        ).chain(CurveTween(curve: Curves.easeOut)),
        weight: 30,
      ),
    ]).animate(_panelsController);

    // Logo animation (400ms)
    _logoController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );

    _logoOpacity = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _logoController, curve: Curves.easeOut));

    // Subtle scale: 1.03 → 1.0 (zoom out slightly for refined feel)
    _logoScale = Tween<double>(
      begin: 1.03,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _logoController, curve: Curves.easeOut));

    // Text animation (400ms)
    _textController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );

    _textOpacity = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _textController, curve: Curves.easeOut));

    _textSlide = Tween<Offset>(
      begin: const Offset(0.0, 0.15),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _textController, curve: Curves.easeOut));

    // Exit fade (500ms)
    _exitController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );

    _exitOpacity = Tween<double>(
      begin: 1.0,
      end: 0.0,
    ).animate(CurvedAnimation(parent: _exitController, curve: Curves.easeOut));
  }

  void _runSequence() async {
    // Phase 1: Background fades in (0-300ms)
    _backgroundController.forward();

    // Phase 2: Tech panels slide in (300ms-1200ms)
    await Future.delayed(const Duration(milliseconds: 300));
    if (!mounted) return;
    _panelsController.forward();

    // Phase 3: Logo appears (1400ms-1800ms)
    await Future.delayed(const Duration(milliseconds: 500));
    if (!mounted) return;
    _logoController.forward();

    // Phase 4: Text fades in (1800ms-2200ms)
    await Future.delayed(const Duration(milliseconds: 400));
    if (!mounted) return;
    _textController.forward();

    // Phase 5: Hold for appreciation (2200ms-2700ms)
    await Future.delayed(const Duration(milliseconds: 500));
    if (!mounted) return;

    // Phase 6: Navigate with fade (2700ms-3200ms)
    _exitController.forward();
    await Future.delayed(const Duration(milliseconds: 300));
    if (!mounted) return;
    _navigate();
  }

  void _navigate() {
    if (!mounted) return;

    final user = AuthService.instance.currentUser;
    if (user != null) {
      final role = user.role.value;
      switch (role) {
        case 'SALESMAN':
          context.go(RouteConstants.SALESMAN_DASHBOARD);
        case 'SERVICE_ENGINEER':
          context.go(RouteConstants.SERVICE_ENGINEER_DASHBOARD);
        case 'ADMIN':
          context.go(RouteConstants.ADMIN_DASHBOARD);
        case 'RECEPTION':
          context.go(RouteConstants.RECEPTION_DASHBOARD);
        default:
          context.go(RouteConstants.LOGIN);
      }
    } else {
      context.go(RouteConstants.LOGIN);
    }
  }

  @override
  void dispose() {
    _backgroundController.dispose();
    _panelsController.dispose();
    _logoController.dispose();
    _textController.dispose();
    _exitController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: _darkBackground,
      body: AnimatedBuilder(
        animation: Listenable.merge([
          _backgroundController,
          _panelsController,
          _logoController,
          _textController,
          _exitController,
        ]),
        builder: (context, _) {
          return Opacity(
            opacity: _exitOpacity.value,
            child: Stack(
              children: [
                // Layer 1: Dark tech gradient background
                _buildBackground(),

                // Layer 2: Subtle grid pattern (tech feel)
                _buildGridPattern(size),

                // Layer 3: Tech panels (animate around logo)
                _buildTechPanels(size),

                // Layer 4: Soft glow behind logo (appears with logo)
                _buildLogoGlow(),

                // Layer 5: Main content (logo + text)
                _buildMainContent(),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildBackground() {
    return Opacity(
      opacity: _backgroundOpacity.value,
      child: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [_darkBackground, _darkSecondary, Color(0xFF0F1C2E)],
            stops: [0.0, 0.5, 1.0],
          ),
        ),
      ),
    );
  }

  Widget _buildGridPattern(Size size) {
    return Opacity(
      opacity: _backgroundOpacity.value * 0.05,
      child: CustomPaint(size: size, painter: _GridPatternPainter()),
    );
  }

  Widget _buildTechPanels(Size size) {
    final panelWidth = size.width * 0.7;
    final panelHeight = size.height * 0.25;

    return Stack(
      children: [
        // Blue panel - slides from left
        Positioned(
          left: size.width * 0.15,
          top: size.height * 0.3,
          child: SlideTransition(
            position: _bluePanelSlide,
            child: Opacity(
              opacity: _panelsOpacity.value,
              child: _buildPanel(
                width: panelWidth,
                height: panelHeight,
                color: _cyanAccent,
                borderRadius: 20,
              ),
            ),
          ),
        ),

        // Pink panel - slides from right
        Positioned(
          right: size.width * 0.15,
          top: size.height * 0.35,
          child: SlideTransition(
            position: _pinkPanelSlide,
            child: Opacity(
              opacity: _panelsOpacity.value,
              child: _buildPanel(
                width: panelWidth * 0.85,
                height: panelHeight * 0.9,
                color: _magentaAccent,
                borderRadius: 16,
              ),
            ),
          ),
        ),

        // Yellow panel - slides from bottom
        Positioned(
          left: size.width * 0.25,
          bottom: size.height * 0.35,
          child: SlideTransition(
            position: _yellowPanelSlide,
            child: Opacity(
              opacity: _panelsOpacity.value,
              child: _buildPanel(
                width: panelWidth * 0.75,
                height: panelHeight * 0.7,
                color: _yellowAccent,
                borderRadius: 12,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPanel({
    required double width,
    required double height,
    required Color color,
    required double borderRadius,
  }) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(borderRadius),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [color.withOpacity(0.15), color.withOpacity(0.05)],
        ),
        border: Border.all(color: color.withOpacity(0.2), width: 1),
      ),
    );
  }

  Widget _buildLogoGlow() {
    return Center(
      child: Opacity(
        opacity: _logoOpacity.value * 0.4,
        child: Container(
          width: 220,
          height: 220,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: RadialGradient(
              colors: [
                _cyanAccent.withOpacity(0.3),
                _magentaAccent.withOpacity(0.15),
                Colors.transparent,
              ],
              stops: const [0.0, 0.5, 1.0],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMainContent() {
    return SafeArea(
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Spacer(flex: 3),

            // Logo - single image, never split
            _buildLogo(),

            const SizedBox(height: 48),

            // Company name
            _buildCompanyName(),

            const SizedBox(height: 12),

            // Tagline
            _buildTagline(),

            const Spacer(flex: 4),
          ],
        ),
      ),
    );
  }

  Widget _buildLogo() {
    return Opacity(
      opacity: _logoOpacity.value,
      child: Transform.scale(
        scale: _logoScale.value,
        child: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            // Subtle shadow for depth
            boxShadow: [
              BoxShadow(
                color: _cyanAccent.withOpacity(_logoOpacity.value * 0.2),
                blurRadius: 30,
                spreadRadius: 0,
              ),
            ],
          ),
          child: Image.asset(
            'assets/images/mainlogobgre.png',
            width: 160,
            height: 160,
            fit: BoxFit.contain,
          ),
        ),
      ),
    );
  }

  Widget _buildCompanyName() {
    return SlideTransition(
      position: _textSlide,
      child: Opacity(
        opacity: _textOpacity.value,
        child: ShaderMask(
          shaderCallback: (bounds) {
            return const LinearGradient(
              colors: [_cyanAccent, Colors.white, _magentaAccent],
              stops: [0.0, 0.5, 1.0],
            ).createShader(bounds);
          },
          blendMode: BlendMode.srcIn,
          child: const Text(
            'YAMINI INFOTECH',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w700,
              letterSpacing: 3,
              color: Colors.white,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTagline() {
    return SlideTransition(
      position: _textSlide,
      child: Opacity(
        opacity: _textOpacity.value * 0.7,
        child: const Text(
          'Empowering Business Solutions',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w400,
            letterSpacing: 1.5,
            color: Colors.white54,
          ),
        ),
      ),
    );
  }
}

/// Subtle grid pattern for tech background
class _GridPatternPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    if (size.width <= 0 || size.height <= 0) return;

    final paint = Paint()
      ..color = Colors.white.withOpacity(0.3)
      ..strokeWidth = 0.5
      ..style = PaintingStyle.stroke;

    const spacing = 40.0;

    // Vertical lines
    for (double x = 0; x <= size.width; x += spacing) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }

    // Horizontal lines
    for (double y = 0; y <= size.height; y += spacing) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
