import bcrypt
import inspect
print('module file:', getattr(bcrypt,'__file__',None))
print('has __about__:', hasattr(bcrypt,'__about__'))
print('has __version__:', hasattr(bcrypt,'__version__'))
print('attrs sample:', sorted([n for n in dir(bcrypt) if not n.startswith('_')])[:50])
