IDIR = ../include
LDIR = ../lib
ARCH := $(shell getconf LONG_BIT)
CXXFLAGS = -Wall -Wno-c++11-extensions -I $(IDIR) -O2 -m64

LIBFILES = Adt.o Util.o 

%.o : %.cpp %.h ../include/stdinc.h
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all : ${LIBFILES} ${CLASSFILES}
	ar -ru ${LDIR}/lib-util.a ${LIBFILES}

clean :
	rm -f *.o
