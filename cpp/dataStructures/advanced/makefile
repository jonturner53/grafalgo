IDIR = ../../include
LDIR = ../../lib
LIB = ${LDIR}/lib-ds.a
ARCH := $(shell getconf LONG_BIT)
CXXFLAGS_32 = -O2 -m32 -I ${IDIR}
CXXFLAGS_64 = -O2 -m64 -I ${IDIR}
#CXXFLAGS = $(CXXFLAGS_$(ARCH)) 
CXXFLAGS = -Wall -Wno-c++11-extensions -O2 -m64 -I ${IDIR}

OFILES = PathSet.o Dtrees.o

.cpp.o:
	${CXX} ${CXXFLAGS} -c $<

PathSet.o : ${IDIR}/stdinc.h ${IDIR}/PathSet.h
Dtrees.o :  ${IDIR}/stdinc.h ${IDIR}/Dtrees.h

all:	${OFILES}
	ar -ru ${LIB} ${OFILES}

clean:
	rm -f *.o
