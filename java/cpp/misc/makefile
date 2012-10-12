IDIR = ../include
LDIR = ../lib
ARCH := $(shell getconf LONG_BIT)
CXXFLAGS_32 = -O2 -m32 -I ${IDIR}
CXXFLAGS_64 = -O2 -m64 -I ${IDIR}
CXXFLAGS = $(CXXFLAGS_$(ARCH)) 
#CXXFLAGS = -O2 -m64

LIBFILES = Util.o 
CLASSFILES = Util.class

%.o : %.cpp %.h ../include/stdinc.h
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

%.class: %.java
	javac -cp ~/bin/java $<

all : ${LIBFILES} ${CLASSFILES}
	ar -ru ${LDIR}/lib-util.a ${LIBFILES}
	mv *.class ~/bin/java/algoLib/misc

clean :
	rm -f *.o
